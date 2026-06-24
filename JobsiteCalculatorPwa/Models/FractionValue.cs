using System.Globalization;

namespace JobsiteCalculatorPwa.Models;

public readonly record struct FractionValue : IComparable<FractionValue>
{
    public long Numerator { get; }

    public long Denominator { get; }

    public static FractionValue Zero => new(0, 1);

    public FractionValue(long numerator, long denominator)
    {
        if (denominator == 0)
        {
            throw new DivideByZeroException("Fraction denominator cannot be zero.");
        }

        if (denominator < 0)
        {
            numerator *= -1;
            denominator *= -1;
        }

        var divisor = GreatestCommonDivisor(Math.Abs(numerator), denominator);
        Numerator = numerator / divisor;
        Denominator = denominator / divisor;
    }

    public int CompareTo(FractionValue other)
    {
        var left = Numerator * other.Denominator;
        var right = other.Numerator * Denominator;
        return left.CompareTo(right);
    }

    public FractionValue Abs() => new(Math.Abs(Numerator), Denominator);

    public decimal ToDecimal() => Numerator / (decimal)Denominator;

    public FractionValue RoundToDenominator(int denominator)
    {
        if (denominator <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(denominator), "Display denominator must be positive.");
        }

        var scaledNumerator = Numerator * denominator;
        var whole = scaledNumerator / Denominator;
        var remainder = Math.Abs(scaledNumerator % Denominator);

        if (remainder * 2 >= Denominator)
        {
            whole += Math.Sign(scaledNumerator);
        }

        return new FractionValue(whole, denominator);
    }

    public string ToMixedString()
    {
        if (Numerator == 0)
        {
            return "0";
        }

        var sign = Numerator < 0 ? "-" : string.Empty;
        var absolute = Abs();
        var whole = absolute.Numerator / absolute.Denominator;
        var remainder = absolute.Numerator % absolute.Denominator;

        if (remainder == 0)
        {
            return $"{sign}{whole}";
        }

        if (whole == 0)
        {
            return $"{sign}{remainder}/{absolute.Denominator}";
        }

        return $"{sign}{whole} {remainder}/{absolute.Denominator}";
    }

    public override string ToString() => ToMixedString();

    public static FractionValue Parse(string input)
    {
        if (!TryParse(input, out var value))
        {
            throw new FormatException($"Unable to parse fraction value '{input}'.");
        }

        return value;
    }

    public static bool TryParse(string? input, out FractionValue value)
    {
        value = Zero;

        if (string.IsNullOrWhiteSpace(input))
        {
            return false;
        }

        var normalized = NormalizeWhitespace(input);

        if (normalized.Contains(' '))
        {
            var parts = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2 && TryParse(parts[0], out var wholePart) && TryParseSimpleFraction(parts[1], out var fractionPart))
            {
                value = wholePart.Numerator < 0
                    ? wholePart - fractionPart
                    : wholePart + fractionPart;
                return true;
            }
        }

        if (TryParseSimpleFraction(normalized, out value))
        {
            return true;
        }

        if (normalized.Contains('.'))
        {
            try
            {
                value = FromDecimalString(normalized);
                return true;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        if (long.TryParse(normalized, NumberStyles.Integer, CultureInfo.InvariantCulture, out var integerValue))
        {
            value = new FractionValue(integerValue, 1);
            return true;
        }

        return false;
    }

    public static FractionValue FromDecimalString(string input)
    {
        var normalized = NormalizeWhitespace(input);
        var sign = 1L;

        if (normalized.StartsWith("-", StringComparison.Ordinal))
        {
            sign = -1;
            normalized = normalized[1..];
        }
        else if (normalized.StartsWith("+", StringComparison.Ordinal))
        {
            normalized = normalized[1..];
        }

        var parts = normalized.Split('.', StringSplitOptions.None);
        if (parts.Length != 2
            || !long.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var whole)
            || !long.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var decimals))
        {
            throw new FormatException($"Unable to parse decimal value '{input}'.");
        }

        var scale = 1L;
        for (var index = 0; index < parts[1].Length; index++)
        {
            scale *= 10;
        }

        var numerator = (whole * scale) + decimals;
        return new FractionValue(sign * numerator, scale);
    }

    public static FractionValue operator +(FractionValue left, FractionValue right) =>
        new((left.Numerator * right.Denominator) + (right.Numerator * left.Denominator), left.Denominator * right.Denominator);

    public static FractionValue operator -(FractionValue left, FractionValue right) =>
        new((left.Numerator * right.Denominator) - (right.Numerator * left.Denominator), left.Denominator * right.Denominator);

    public static FractionValue operator *(FractionValue left, FractionValue right) =>
        new(left.Numerator * right.Numerator, left.Denominator * right.Denominator);

    public static FractionValue operator /(FractionValue left, FractionValue right)
    {
        if (right.Numerator == 0)
        {
            throw new DivideByZeroException("Cannot divide by zero.");
        }

        return new(left.Numerator * right.Denominator, left.Denominator * right.Numerator);
    }

    public static FractionValue operator *(FractionValue left, int right) =>
        new(left.Numerator * right, left.Denominator);

    public static FractionValue operator /(FractionValue left, int right)
    {
        if (right == 0)
        {
            throw new DivideByZeroException("Cannot divide by zero.");
        }

        return new(left.Numerator, left.Denominator * right);
    }

    private static bool TryParseSimpleFraction(string input, out FractionValue value)
    {
        value = Zero;
        var tokens = input.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (tokens.Length != 2
            || !long.TryParse(tokens[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var numerator)
            || !long.TryParse(tokens[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var denominator))
        {
            return false;
        }

        value = new FractionValue(numerator, denominator);
        return true;
    }

    private static long GreatestCommonDivisor(long left, long right)
    {
        while (right != 0)
        {
            var temporary = left % right;
            left = right;
            right = temporary;
        }

        return left == 0 ? 1 : left;
    }

    private static string NormalizeWhitespace(string input) =>
        string.Join(' ', input.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));
}
