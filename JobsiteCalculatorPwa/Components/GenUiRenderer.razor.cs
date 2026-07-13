using System.Collections.Generic;
using System.Threading.Tasks;
using JobsiteCalculatorPwa.Models;
using Microsoft.AspNetCore.Components;

namespace JobsiteCalculatorPwa.Components;

public partial class GenUiRenderer : ComponentBase
{
    [Parameter]
    public List<GenUiComponent> Components { get; set; } = new();

    [Parameter]
    public EventCallback<string> OnOptionTapped { get; set; }

    protected async Task HandleOptionTapped(string option)
    {
        // Instantiates or updates 'ContextChipBarDto' at index 0 of the container
        ContextChipBarDto? chipBar = null;

        if (Components.Count > 0 && Components[0] is ContextChipBarDto existingChipBar)
        {
            chipBar = existingChipBar;
        }
        else
        {
            chipBar = new ContextChipBarDto { ActiveChips = new List<string>() };
            Components.Insert(0, chipBar);
        }

        if (!chipBar.ActiveChips.Contains(option))
        {
            chipBar.ActiveChips.Add(option);
        }

        if (OnOptionTapped.HasDelegate)
        {
            await OnOptionTapped.InvokeAsync(option);
        }

        StateHasChanged();
    }

    protected void HandleChipRemoved(string chip)
    {
        StateHasChanged();
    }
}
