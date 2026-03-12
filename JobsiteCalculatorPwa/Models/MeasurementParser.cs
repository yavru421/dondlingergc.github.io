using System.Text.RegularExpressions;

namespace JobsiteCalculatorPwa.Models;

public static partial class MeasurementParser
{
    public static Measurement Parse(string input)
    {
        if (!TryParse(input, out var measurement))
        {
            throw new FormatException($"Unable to parse measurement '{input}'.");
        }

        return measurement;
    }

    public static bool TryParse(string? input, out Measurement measurement)
    {
        measurement = default;

        if (string.IsNullOrWhiteSpace(input))
        {
            return false;
        }

        var normalized = Normalize(input);
        var metricMatch = MetricPattern().Match(normalized);
        if (metricMatch.Success)
        {
            var value = FractionValue.Parse(metricMatch.Groups["value"].Value);
            var unit = metricMatch.Groups["unit"].Value;

            var inches = unit switch
            {
                "mm" => value * new FractionValue(5, 127),
                "cm" => value * new FractionValue(50, 127),
                "m" => value * new FractionValue(5000, 127),
                _ => FractionValue.Zero,
            };

            measurement = new Measurement(inches);
            return true;
        }

        var total = FractionValue.Zero;
        var matchedAny = false;
        var remaining = normalized;

        var feetMatch = FeetPattern().Match(remaining);
        if (feetMatch.Success)
        {
            total += FractionValue.Parse(feetMatch.Groups["value"].Value) * 12;
            remaining = remaining.Replace(feetMatch.Value, " ", StringComparison.Ordinal);
            matchedAny = true;
        }

        var inchMatch = InchPattern().Match(remaining);
        if (inchMatch.Success)
        {
            total += FractionValue.Parse(inchMatch.Groups["value"].Value);
            remaining = remaining.Replace(inchMatch.Value, " ", StringComparison.Ordinal);
            matchedAny = true;
        }

        remaining = remaining.Replace("\"", " ", StringComparison.Ordinal)
            .Replace("in", " ", StringComparison.Ordinal)
            .Replace("'", " ", StringComparison.Ordinal);
        remaining = Regex.Replace(remaining, @"\s+", " ").Trim();

        if (!string.IsNullOrWhiteSpace(remaining))
        {
            total += FractionValue.Parse(remaining);
            matchedAny = true;
        }

        if (!matchedAny)
        {
            return false;
        }

        measurement = new Measurement(total);
        return true;
    }

    private static string Normalize(string input) =>
        Regex.Replace(
            input.Trim()
                .ToLowerInvariant()
                .Replace("feet", "ft", StringComparison.Ordinal)
                .Replace("foot", "ft", StringComparison.Ordinal)
                .Replace("inches", "in", StringComparison.Ordinal)
                .Replace("inch", "in", StringComparison.Ordinal)
                .Replace("′", "'", StringComparison.Ordinal)
                .Replace("″", "\"", StringComparison.Ordinal),
            @"\s+",
            " ");

    [GeneratedRegex(@"^(?<value>-?(?:\d+\s+\d+/\d+|\d+/\d+|\d+\.\d+|\d+))\s*(?<unit>mm|cm|m)$", RegexOptions.Compiled)]
    private static partial Regex MetricPattern();

    [GeneratedRegex(@"(?<value>-?(?:\d+\.\d+|\d+))\s*(?:ft|')", RegexOptions.Compiled)]
    private static partial Regex FeetPattern();

    [GeneratedRegex(@"(?<value>-?(?:\d+\s+\d+/\d+|\d+/\d+|\d+\.\d+|\d+))\s*(?:in|"")", RegexOptions.Compiled)]
    private static partial Regex InchPattern();
}
