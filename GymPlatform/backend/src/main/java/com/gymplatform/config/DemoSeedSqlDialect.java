package com.gymplatform.config;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Traduce SQL de seeds demo escrito para H2 a sintaxis PostgreSQL.
 */
final class DemoSeedSqlDialect {

    private DemoSeedSqlDialect() {}

    private static final Pattern RESTART_WITH = Pattern.compile(
            "ALTER TABLE ([a-z_]+) ALTER COLUMN id RESTART WITH (\\d+);",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern CONCAT_TIMESTAMP = Pattern.compile(
            "CAST\\(CONCAT\\(CAST\\((.+?) AS VARCHAR\\), ' (\\d{2}:\\d{2}:\\d{2})'\\) AS TIMESTAMP\\)",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final String[] H2_DATE_PARTS = {"YEAR", "MONTH", "DAY", "HOUR", "MINUTE", "SECOND"};

    static final String[] H2_REMNANTS = {
        "DATEADD(",
        "YEAR(",
        "MONTH(",
        "DAY(",
        "HOUR(",
        "MINUTE(",
        "SECOND(",
        "RESTART WITH",
        "AS VARCHAR"
    };

    static String toPostgres(String h2Sql) {
        String sql = stripLineComments(h2Sql);
        sql = sql.replace("SET REFERENTIAL_INTEGRITY FALSE;", "-- PostgreSQL: inserts demo en orden de FK");
        sql = sql.replace("SET REFERENTIAL_INTEGRITY TRUE;", "-- fin seeds demo");
        sql = replaceAllDateAdd(sql);
        sql = replaceDatePartFunctions(sql);
        sql = replaceConcatTimestamps(sql);
        sql = replaceRestartWith(sql);
        return sql;
    }

    static String postgresScriptPath(String h2Classpath) {
        return h2Classpath.replace("db/", "db/postgres/");
    }

    /** Evita traducir DATEADD dentro de comentarios (-- …). */
    private static String stripLineComments(String sql) {
        StringBuilder out = new StringBuilder(sql.length());
        for (String line : sql.split("\n", -1)) {
            int comment = line.indexOf("--");
            if (comment >= 0) {
                out.append(line, 0, comment);
            } else {
                out.append(line);
            }
            out.append('\n');
        }
        return out.toString();
    }

    static String dateAdd(String unit, int amount, String base, boolean postgres) {
        if (!postgres) {
            return "DATEADD('" + unit + "', " + amount + ", " + base + ")";
        }
        String intervalUnit = pgIntervalUnit(unit);
        int abs = Math.abs(amount);
        String sign = amount < 0 ? " - " : " + ";
        return "(" + base + sign + "INTERVAL '" + abs + " " + intervalUnit + "')";
    }

    private static String pgIntervalUnit(String unit) {
        return switch (unit.toUpperCase(Locale.ROOT)) {
            case "YEAR" -> "year";
            case "MONTH" -> "month";
            case "DAY" -> "day";
            case "HOUR" -> "hour";
            case "MINUTE" -> "minute";
            default -> throw new IllegalArgumentException("Unidad DATEADD no soportada: " + unit);
        };
    }

    /** Traduce DATEADD de adentro hacia afuera (soporta anidados). */
    private static String replaceAllDateAdd(String sql) {
        String current = sql;
        while (indexOfIgnoreCase(current, "DATEADD(", 0) >= 0) {
            int bestStart = -1;
            int bestEnd = -1;
            int bestLength = Integer.MAX_VALUE;
            int search = 0;
            while (true) {
                int start = indexOfIgnoreCase(current, "DATEADD(", search);
                if (start < 0) {
                    break;
                }
                int end = findDateAddEnd(current, start);
                String call = current.substring(start, end);
                DateAddParts parts = parseDateAddCall(call);
                if (indexOfIgnoreCase(parts.base(), "DATEADD(", 0) >= 0) {
                    search = start + 1;
                    continue;
                }
                int length = end - start;
                if (length < bestLength) {
                    bestLength = length;
                    bestStart = start;
                    bestEnd = end;
                }
                search = start + 1;
            }
            if (bestStart < 0) {
                int sampleAt = indexOfIgnoreCase(current, "DATEADD(", 0);
                String sample = current.substring(
                        sampleAt, Math.min(current.length(), sampleAt + Math.min(160, current.length() - sampleAt)));
                throw new IllegalArgumentException("DATEADD anidado no reconocido cerca de: " + sample);
            }
            String translated = translateDateAddCall(current.substring(bestStart, bestEnd));
            current = current.substring(0, bestStart) + translated + current.substring(bestEnd);
        }
        return current;
    }

    private record DateAddParts(String unit, int amount, String base) {}

    private static DateAddParts parseDateAddCall(String call) {
        int open = call.indexOf('(');
        if (open < 0 || !call.endsWith(")")) {
            throw new IllegalArgumentException("DATEADD inválido: " + call);
        }
        String inner = call.substring(open + 1, call.length() - 1).trim();
        if (inner.length() < 5 || inner.charAt(0) != '\'') {
            throw new IllegalArgumentException("DATEADD inválido: " + call);
        }
        int unitClose = inner.indexOf('\'', 1);
        if (unitClose < 0) {
            throw new IllegalArgumentException("DATEADD sin unidad: " + call);
        }
        String unit = inner.substring(1, unitClose);

        int pos = unitClose + 1;
        pos = skipWhitespace(inner, pos);
        if (pos >= inner.length() || inner.charAt(pos) != ',') {
            throw new IllegalArgumentException("DATEADD sin amount: " + call);
        }
        pos++;

        pos = skipWhitespace(inner, pos);
        int amountStart = pos;
        if (inner.charAt(pos) == '-') {
            pos++;
        }
        while (pos < inner.length() && Character.isDigit(inner.charAt(pos))) {
            pos++;
        }
        String amountRaw = inner.substring(amountStart, pos).trim();
        int amount = Integer.parseInt(amountRaw);

        pos = skipWhitespace(inner, pos);
        if (pos >= inner.length() || inner.charAt(pos) != ',') {
            throw new IllegalArgumentException("DATEADD sin base: " + call);
        }
        pos++;

        String base = inner.substring(pos).trim();
        return new DateAddParts(unit, amount, base);
    }

    private static int skipWhitespace(String text, int pos) {
        while (pos < text.length() && Character.isWhitespace(text.charAt(pos))) {
            pos++;
        }
        return pos;
    }

    private static int findDateAddEnd(String sql, int start) {
        int depth = 0;
        for (int i = start; i < sql.length(); i++) {
            char c = sql.charAt(i);
            if (c == '(') {
                depth++;
            } else if (c == ')') {
                depth--;
                if (depth == 0) {
                    return i + 1;
                }
            }
        }
        throw new IllegalArgumentException("DATEADD sin cierre en posición " + start);
    }

    private static String translateDateAddCall(String call) {
        DateAddParts parts = parseDateAddCall(call);
        return dateAdd(parts.unit(), parts.amount(), parts.base(), true);
    }

    /** H2: YEAR(x) → PostgreSQL: EXTRACT(YEAR FROM x) (idem MONTH, DAY, …). */
    private static String replaceDatePartFunctions(String sql) {
        String current = sql;
        for (String part : H2_DATE_PARTS) {
            current = replaceDatePartFunction(current, part);
        }
        return current;
    }

    private static String replaceDatePartFunction(String sql, String part) {
        String needle = part + "(";
        StringBuilder out = new StringBuilder();
        int pos = 0;
        while (true) {
            int start = indexOfIgnoreCase(sql, needle, pos);
            if (start < 0) {
                out.append(sql, pos, sql.length());
                break;
            }
            out.append(sql, pos, start);
            int openParen = start + part.length();
            int end = findMatchingParenEnd(sql, openParen);
            String arg = sql.substring(openParen + 1, end - 1).trim();
            out.append("EXTRACT(")
                    .append(part.toUpperCase(Locale.ROOT))
                    .append(" FROM ")
                    .append(arg)
                    .append(")");
            pos = end;
        }
        return out.toString();
    }

    private static int findMatchingParenEnd(String sql, int openParenPos) {
        int depth = 0;
        for (int i = openParenPos; i < sql.length(); i++) {
            char c = sql.charAt(i);
            if (c == '(') {
                depth++;
            } else if (c == ')') {
                depth--;
                if (depth == 0) {
                    return i + 1;
                }
            }
        }
        throw new IllegalArgumentException("Paréntesis sin cierre en posición " + openParenPos);
    }

    private static String replaceConcatTimestamps(String sql) {
        Matcher matcher = CONCAT_TIMESTAMP.matcher(sql);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            String replacement = "((" + matcher.group(1).trim() + ")::date + TIME '" + matcher.group(2) + "')::timestamp";
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }

    private static String replaceRestartWith(String sql) {
        Matcher matcher = RESTART_WITH.matcher(sql);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            String table = matcher.group(1).toLowerCase(Locale.ROOT);
            String replacement =
                    "SELECT setval(pg_get_serial_sequence('" + table + "', 'id'), " + matcher.group(2) + ", false);";
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }

    private static int indexOfIgnoreCase(String text, String needle, int from) {
        String lower = text.toLowerCase(Locale.ROOT);
        String needleLower = needle.toLowerCase(Locale.ROOT);
        return lower.indexOf(needleLower, from);
    }
}
