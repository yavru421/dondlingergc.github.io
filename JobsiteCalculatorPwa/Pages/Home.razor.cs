using Microsoft.AspNetCore.Components;
using JobsiteCalculatorPwa.Models;
using JobsiteCalculatorPwa.Services;

namespace JobsiteCalculatorPwa.Pages;

public partial class Home : ComponentBase
{
    [Inject]
    private ConstructionMathService Calculator { get; set; } = default!;

    private readonly int[] PrecisionOptions = [64, 32, 16, 8, 4, 2];

    private readonly ExampleExpression[] Examples =
    [
        new("Inside add", "1'5\" + (12\" + 15\")", "Simple parenthesis check"),
        new("Repeated run", "((3'11 1/2\" + 5/8\") * 6) - 1/4\"", "Good for repeated parts"),
        new("Split a difference", "(7'11 1/4\" - 3'5 1/4\") / 3", "Common layout math"),
    ];

    private readonly InsertKey[] InsertKeys =
    [
        new("'", "'", "Feet mark"),
        new("\"", "\"", "Inch mark"),
        new("(", "(", "Open parenthesis"),
        new(")", ")", "Close parenthesis"),
        new("+", " + ", "Add"),
        new("-", " - ", "Subtract"),
        new("*", " * ", "Multiply"),
        new("/", " / ", "Divide"),
        new("1/2", "1/2", "Half inch fraction"),
        new("1/4", "1/4", "Quarter inch fraction"),
        new("1/8", "1/8", "Eighth inch fraction"),
        new("=", "=", "Trailing equals"),
    ];

    private readonly List<HistoryEntry> History = [];

    private string _expression = "1'5\" + (12\" + 15\")=";
    private DisplayMode PreferredDisplay = DisplayMode.FeetAndInches;
    private int PrecisionDenominator = 16;
    private ConstructionExpressionResult? Result;
    private string? ExpressionError;

    private string Expression
    {
        get => _expression;
        set
        // Formatting pipeline for normalization
        private string NormalizeExpression(string expr)
        {
            if (string.IsNullOrWhiteSpace(expr)) return string.Empty;
            // Normalize operator spacing
            expr = System.Text.RegularExpressions.Regex.Replace(expr, "\s*([+\-*/])\s*", " $1 ");
            // Collapse multiple spaces
            expr = System.Text.RegularExpressions.Regex.Replace(expr, "\s+", " ");
            // Attach units directly to numbers/fractions
            expr = System.Text.RegularExpressions.Regex.Replace(expr, "(\d|\d+\/\d)\s*(['\"])", "$1$2");
            // Remove spaces before units
            expr = System.Text.RegularExpressions.Regex.Replace(expr, "\s+(['\"])", "$1");
            // Normalize fractions as atomic tokens
            expr = System.Text.RegularExpressions.Regex.Replace(expr, "(\d+)\s*\/\s*(\d+)", "$1/$2");
            // Remove spaces inside parentheses
            expr = System.Text.RegularExpressions.Regex.Replace(expr, "\(\s*", "(");
            expr = System.Text.RegularExpressions.Regex.Replace(expr, "\s*\)", ")");
            // Remove trailing operators
            expr = System.Text.RegularExpressions.Regex.Replace(expr, "([+\-*/])\s*$", "");
            return expr.Trim();
        }
        {
            if (string.Equals(_expression, value, StringComparison.Ordinal))
            {
                return;
            }

            _expression = value;
            RefreshResult();
        }
    }
                // Minimal formatting on keystroke: operator spacing
                var formatted = System.Text.RegularExpressions.Regex.Replace(value, "\s*([+\-*/])\s*", " $1 ");
                _expression = formatted;
                RefreshResult();
    {
        RefreshResult();
    }

    private void SolveExpression()
            // Keypad always inserts normalized tokens
            if (value == "'" || value == "\"")
            {
                // Attach unit directly to previous number/fraction
                Expression = System.Text.RegularExpressions.Regex.Replace(Expression, "(\d|\d+\/\d)\s*$", "$1") + value;
            }
            else if (value == "+" || value == "-" || value == "*" || value == "/")
            {
                Expression += " " + value + " ";
            }
            else if (value == "1/2" || value == "1/4" || value == "1/8")
            {
                Expression += value;
            }
            else
            {
                Expression += value;
            }
            // Optionally normalize after token insertion
            Expression = NormalizeExpression(Expression);
        EvaluateExpression(addToHistory: true);
    }

    private void EvaluateExpression(bool addToHistory)
            if (string.IsNullOrEmpty(Expression)) return;
            // Smart backspace: delete whole token if after unit or fraction
            var expr = Expression;
            // Remove unit if at end
            if (expr.EndsWith("'") || expr.EndsWith("\""))
            {
                Expression = expr[..^1];
                return;
            }
            // Remove fraction if at end
            var fracMatch = System.Text.RegularExpressions.Regex.Match(expr, "(\d+\/\d)$");
            if (fracMatch.Success)
            {
                Expression = expr[..^fracMatch.Index];
                return;
            }
            // Remove operator with spaces
            var opMatch = System.Text.RegularExpressions.Regex.Match(expr, "\s([+\-*/])\s$", System.Text.RegularExpressions.RegexOptions.RightToLeft);
            if (opMatch.Success)
            {
                Expression = expr[..^opMatch.Length];
                return;
            }
            // Remove last character
            Expression = expr[..^1];
        {
            Result = Calculator.EvaluateExpression(new ConstructionExpressionInput(
                Expression,
                PreferredDisplay,
                PrecisionDenominator));

            if (addToHistory)
            {
                AddHistory(Result);
            Expression = NormalizeExpression(expression);
            SolveExpression();
        catch (Exception ex)
        {
            Result = null;
            ExpressionError = ex.Message;
        }
    }

    private void RefreshResult()
    {
        if (string.IsNullOrWhiteSpace(Expression))
            // Normalize on blur/solve
            _expression = NormalizeExpression(Expression);
            EvaluateExpression(addToHistory: false);
            Result = null;
            ExpressionError = null;
            return;
        }

        EvaluateExpression(addToHistory: false);
    }

    private void AppendToken(string value)
    {
        Expression += value;
    }

    private void Backspace()
    {
        if (Expression.Length == 0)
        {
            return;
        }

        Expression = Expression[..^1];
                if (!addToHistory)
                {
                    ExpressionError = "Incomplete or invalid expression.";
                }
                else
                {
                    Result = null;
                    ExpressionError = ex.Message;
                }
    }

    private void ClearExpression()
    {
        Expression = string.Empty;
    }

    private void LoadExample(string expression)
    {
        Expression = expression;
        SolveExpression();
    }

    private void AddHistory(ConstructionExpressionResult result)
    {
        History.RemoveAll(entry => string.Equals(entry.Expression, result.Expression, StringComparison.OrdinalIgnoreCase));
        History.Insert(0, new HistoryEntry(result.Expression, result.Primary));

        if (History.Count > 6)
        {
            History.RemoveRange(6, History.Count - 6);
        }
    }

    private static string GetDisplayLabel(DisplayMode mode) =>
        mode switch
        {
            DisplayMode.FeetAndInches => "Feet + inches",
            DisplayMode.FractionalInches => "Fraction inches",
            DisplayMode.DecimalFeet => "Decimal feet",
            DisplayMode.Millimeters => "Millimeters",
            _ => mode.ToString(),
        };

    private sealed record ExampleExpression(string Label, string Expression, string Note);

    private sealed record InsertKey(string Label, string Value, string Description);

    private sealed record HistoryEntry(string Expression, string Result);
}
