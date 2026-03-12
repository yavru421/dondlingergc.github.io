using System.Globalization;

namespace JobsiteCalculatorPwa.Models;

public enum DisplayMode
{
    FeetAndInches,
    FractionalInches,
    DecimalFeet,
    Millimeters
}

public readonly record struct Measurement
{
    public Measurement(FractionValue totalInches)
    {
        TotalInches = totalInches;
    }

    public FractionValue TotalInches { get; }

    public decimal InchesDecimal => TotalInches.ToDecimal();

    public decimal FeetDecimal => InchesDecimal / 12m;

    public string ToPrimaryString(DisplayMode mode, int precisionDenominator) =>
        mode switch
        {
            DisplayMode.FeetAndInches => ToFeetAndInchesString(precisionDenominator),
            DisplayMode.FractionalInches => ToFractionalInchesString(precisionDenominator),
            DisplayMode.DecimalFeet => ToDecimalFeetString(),
            DisplayMode.Millimeters => ToMetricString(),
            _ => ToFeetAndInchesString(precisionDenominator),
        };

    public string ToFeetAndInchesString(int precisionDenominator)
    {
        var rounded = TotalInches.RoundToDenominator(precisionDenominator);
        var sign = rounded.Numerator < 0 ? "-" : string.Empty;
        var absolute = rounded.Abs();
        var totalWholeInches = absolute.Numerator / absolute.Denominator;
        var feet = totalWholeInches / 12;
        var inchWhole = totalWholeInches % 12;
        var remainderNumerator = absolute.Numerator - ((feet * 12) + inchWhole) * absolute.Denominator;
        var fraction = remainderNumerator == 0
            ? string.Empty
            : $" {remainderNumerator}/{absolute.Denominator}";

        return $"{sign}{feet}' {inchWhole}{fraction}\"";
    }

    public string ToFractionalInchesString(int precisionDenominator)
    {
        var rounded = TotalInches.RoundToDenominator(precisionDenominator);
        return $"{rounded.ToMixedString()}\"";
    }

    public string ToDecimalFeetString() => $"{FeetDecimal.ToString("0.###", CultureInfo.InvariantCulture)} ft";

    public string ToMetricString()
    {
        var millimeters = InchesDecimal * 25.4m;
        return $"{millimeters.ToString("0.#", CultureInfo.InvariantCulture)} mm";
    }

    public static Measurement operator +(Measurement left, Measurement right) => new(left.TotalInches + right.TotalInches);

    public static Measurement operator -(Measurement left, Measurement right) => new(left.TotalInches - right.TotalInches);

    public static Measurement operator *(Measurement measurement, int multiplier) => new(measurement.TotalInches * multiplier);

    public static Measurement operator /(Measurement measurement, int divisor) => new(measurement.TotalInches / divisor);
}
