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
        {
            if (string.Equals(_expression, value, StringComparison.Ordinal))
            {
                return;
            }

            _expression = value;
            RefreshResult();
        }
    }

    protected override void OnInitialized()
    {
        RefreshResult();
    }

    private void SolveExpression()
    {
        EvaluateExpression(addToHistory: true);
    }

    private void EvaluateExpression(bool addToHistory)
    {
        ExpressionError = null;

        try
        {
            Result = Calculator.EvaluateExpression(new ConstructionExpressionInput(
                Expression,
                PreferredDisplay,
                PrecisionDenominator));

            if (addToHistory)
            {
                AddHistory(Result);
            }
        }
        catch (Exception ex)
        {
            Result = null;
            ExpressionError = ex.Message;
        }
    }

    private void RefreshResult()
    {
        if (string.IsNullOrWhiteSpace(Expression))
        {
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
