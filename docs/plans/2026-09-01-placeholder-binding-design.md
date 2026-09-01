# Placeholder binding and name-format constraints

## Goal

Allow an Anatomy definition to describe not only the shape of a file tree, but
also the writing format of names captured by placeholders. A definition should
be able to say that `Name` is PascalCase and that every descendant using
`<Name>` must reuse the same captured value.

## JSON shape

Bindings are declared next to `schemaVersion` and `defaultPolicies`:

```json
{
  "structure": {
    "schemaVersion": 1,
    "bindings": {
      "Name": {
        "format": "PascalCase",
        "pattern": "[A-Z][A-Za-z0-9]*"
      }
    }
  }
}
```

`bindings` is optional for backward compatibility. Each binding may provide a
built-in `format`, a custom `pattern`, or both. When both are present, both
constraints must pass. Patterns are evaluated as complete matches, even when
the author omits `^` and `$`.

## Binding scope

When a placeholder directory such as `<Name>Service` matches `UserService`, it
captures `Name = User` for that directory instance. Descendants such as
`<Name>Service.ts` must resolve to the same value. Each repeated directory
instance receives a fresh scope, so `UserService` and `OrderService` can coexist.
Placeholders without an ancestor binding keep their existing independent
matching behavior. An undeclared placeholder remains a generic wildcard.

## Validation and errors

The schema validates binding names, supported formats, and regular-expression
syntax. The checker adds binding-format, binding-pattern, and binding-consistency
issues to the existing result model, preserving block/warn/allow policy
handling. Invalid definitions return the normal definition-validation error.

## Built-in formats

Version one supports `PascalCase`, `camelCase`, `kebab-case`, `snake_case`, and
`SCREAMING_SNAKE_CASE`. The implementation uses full-string checks and does not
attempt to infer acronyms or split words beyond these documented conventions.

## Tests

Add schema tests for binding parsing and invalid patterns; checker tests for each
built-in format, combined format-plus-pattern constraints, captured-value
consistency, independent repeated-directory scopes, and compatibility with
legacy definitions that do not declare bindings.
