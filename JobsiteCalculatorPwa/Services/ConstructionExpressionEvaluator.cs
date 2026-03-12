using System.Text.RegularExpressions;
using JobsiteCalculatorPwa.Models;

namespace JobsiteCalculatorPwa.Services;

internal sealed partial class ConstructionExpressionEvaluator
{
    private readonly string _input;
    private int _position;

    public ConstructionExpressionEvaluator(string input)
    {
        _input = input;
    }

    public ConstructionValue Evaluate()
    {
        var value = ParseExpression();

        SkipWhitespace();
        if (Match('='))
        {
            SkipWhitespace();
        }

        if (!IsAtEnd)
        {
            throw new FormatException($"Unexpected token '{Current}' at position {_position + 1}.");
        }

        return value;
    }

    private ConstructionValue ParseExpression()
    {
        var value = ParseTerm();

        while (true)
        {
            SkipWhitespace();

            if (Match('+'))
            {
                value = Add(value, ParseTerm());
                continue;
            }

            if (Match('-'))
            {
                value = Subtract(value, ParseTerm());
                continue;
            }

            return value;
        }
    }

    private ConstructionValue ParseTerm()
    {
        var value = ParseUnary();

        while (true)
        {
            SkipWhitespace();

            if (MatchMultiplyOperator())
            {
                value = Multiply(value, ParseUnary());
                continue;
            }

            if (MatchDivideOperator())
            {
                value = Divide(value, ParseUnary());
                continue;
            }

            return value;
        }
    }

    private ConstructionValue ParseUnary()
    {
        SkipWhitespace();

        if (Match('+'))
        {
            return ParseUnary();
        }

        if (Match('-'))
        {
            return ParseUnary().Negate();
        }

        return ParsePrimary();
    }

    private ConstructionValue ParsePrimary()
    {
        SkipWhitespace();

        if (Match('('))
        {
            var value = ParseExpression();
            SkipWhitespace();

            if (!Match(')'))
            {
                throw new FormatException("Missing closing parenthesis.");
            }

            return value;
        }

        return ParseLiteral();
    }

    private ConstructionValue ParseLiteral()
    {
        SkipWhitespace();
        var start = _position;
        var sawFractionSlash = false;

        while (!IsAtEnd)
        {
            if (Current == '/')
            {
                if (!sawFractionSlash && IsFractionSlash())
                {
                    sawFractionSlash = true;
                    _position++;
                    continue;
                }

                break;
            }

            if (IsLiteralBoundary(Current))
            {
                break;
            }

            _position++;
        }

        var token = _input[start.._position].Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new FormatException($"Expected a measurement or number at position {start + 1}.");
        }

        if (ExplicitMeasurementPattern().IsMatch(token))
        {
            return ConstructionValue.Length(MeasurementParser.Parse(token).TotalInches);
        }

        if (FractionValue.TryParse(token, out var scalar))
        {
            return ConstructionValue.Scalar(scalar);
        }

        if (MeasurementParser.TryParse(token, out var measurement))
        {
            return ConstructionValue.Scalar(measurement.TotalInches);
        }

        throw new FormatException($"Unable to parse token '{token}'.");
    }

    private bool MatchMultiplyOperator()
    {
        if (IsAtEnd)
        {
            return false;
        }

        if (Current is '*' or 'x' or 'X' or '×')
        {
            _position++;
            return true;
        }

        return false;
    }

    private bool MatchDivideOperator()
    {
        if (IsAtEnd)
        {
            return false;
        }

        if (Current is '/' or '÷')
        {
            _position++;
            return true;
        }

        return false;
    }

    private bool Match(char expected)
    {
        if (IsAtEnd || Current != expected)
        {
            return false;
        }

        _position++;
        return true;
    }

    private void SkipWhitespace()
    {
        while (!IsAtEnd && char.IsWhiteSpace(Current))
        {
            _position++;
        }
    }

    private static bool IsLiteralBoundary(char value) =>
        value is '(' or ')' or '+' or '-' or '*' or '=' or 'x' or 'X' or '×' or '÷';

    private bool IsFractionSlash() =>
        _position > 0
        && _position < (_input.Length - 1)
        && char.IsDigit(_input[_position - 1])
        && char.IsDigit(_input[_position + 1]);

    private static ConstructionValue Add(ConstructionValue left, ConstructionValue right) =>
        left.Kind == ConstructionValueKind.Length || right.Kind == ConstructionValueKind.Length
            ? ConstructionValue.Length(left.Value + right.Value)
            : ConstructionValue.Scalar(left.Value + right.Value);

    private static ConstructionValue Subtract(ConstructionValue left, ConstructionValue right) =>
        left.Kind == ConstructionValueKind.Length || right.Kind == ConstructionValueKind.Length
            ? ConstructionValue.Length(left.Value - right.Value)
            : ConstructionValue.Scalar(left.Value - right.Value);

    private static ConstructionValue Multiply(ConstructionValue left, ConstructionValue right)
    {
        if (left.Kind == ConstructionValueKind.Length && right.Kind == ConstructionValueKind.Length)
        {
            throw new InvalidOperationException("Multiplying two measurements is not supported. Multiply by a unitless count instead.");
        }

        return left.Kind == ConstructionValueKind.Length || right.Kind == ConstructionValueKind.Length
            ? ConstructionValue.Length(left.Value * right.Value)
            : ConstructionValue.Scalar(left.Value * right.Value);
    }

    private static ConstructionValue Divide(ConstructionValue left, ConstructionValue right)
    {
        if (right.Value.Numerator == 0)
        {
            throw new DivideByZeroException("Cannot divide by zero.");
        }

        if (right.Kind == ConstructionValueKind.Length)
        {
            throw new InvalidOperationException("Dividing by a measurement is not supported. Divide by a unitless number instead.");
        }

        return left.Kind == ConstructionValueKind.Length
            ? ConstructionValue.Length(left.Value / right.Value)
            : ConstructionValue.Scalar(left.Value / right.Value);
    }

    private bool IsAtEnd => _position >= _input.Length;

    private char Current => _input[_position];

    [GeneratedRegex("""(?:['"])|(?<=\d|\s)(?:ft|feet|foot|in|inch|inches|mm|cm|m)\b""", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex ExplicitMeasurementPattern();
}

internal enum ConstructionValueKind
{
    Scalar,
    Length
}

internal readonly record struct ConstructionValue(FractionValue Value, ConstructionValueKind Kind)
{
    public static ConstructionValue Scalar(FractionValue value) => new(value, ConstructionValueKind.Scalar);

    public static ConstructionValue Length(FractionValue value) => new(value, ConstructionValueKind.Length);

    public ConstructionValue Negate() => new(new FractionValue(-Value.Numerator, Value.Denominator), Kind);
}
