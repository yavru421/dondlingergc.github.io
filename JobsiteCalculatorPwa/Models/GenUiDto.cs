using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace JobsiteCalculatorPwa.Models;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(TruncatedCardDto), "truncatedcard")]
[JsonDerivedType(typeof(TruncatedCardDto), "TruncatedCardDto")]
[JsonDerivedType(typeof(TruncatedCardDto), "truncatedCardDto")]
[JsonDerivedType(typeof(ButtonSelectDto), "buttonselect")]
[JsonDerivedType(typeof(ButtonSelectDto), "ButtonSelectDto")]
[JsonDerivedType(typeof(ButtonSelectDto), "buttonSelectDto")]
[JsonDerivedType(typeof(ContextChipBarDto), "contextchipbar")]
[JsonDerivedType(typeof(ContextChipBarDto), "ContextChipBarDto")]
[JsonDerivedType(typeof(ContextChipBarDto), "contextChipBarDto")]
public abstract class GenUiComponent
{
    public abstract string Type { get; }
    public string Id { get; set; } = Guid.NewGuid().ToString();
}

public class TruncatedCardDto : GenUiComponent
{
    public override string Type => "truncatedcard";
    public string Header { get; set; } = string.Empty;
    public string EssentialText { get; set; } = string.Empty;
    public string TapToExpandText { get; set; } = string.Empty;
}

public class ButtonSelectDto : GenUiComponent
{
    public override string Type => "buttonselect";
    public string Title { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public string CallbackEvent { get; set; } = string.Empty;
}

public class ContextChipBarDto : GenUiComponent
{
    public override string Type => "contextchipbar";
    public List<string> ActiveChips { get; set; } = new();
}
