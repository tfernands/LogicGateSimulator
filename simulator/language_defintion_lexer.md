# Custom Language Definition

## Introduction
This document we are defining a custom language in the LogicGateSimulator compiler. It outlines the necessary components and syntax rules of the language.

## Syntax Rules
1. **Comments**: Comments in this language are denoted by the `//` symbol. Anything following this symbol on the same line will be ignored by the compiler.

    **Example:**
    ```
    // This is a comment
    ```

2. **Variables**: Variables in this language can be declared on the fly. They must start with a letter and can only contain alphanumeric characters and underscores. Integers are the only supported data type.

    **Example:**
    ```
    x = 5
    ```

3. **Operators**: The language supports the following operators:
    - Arithmetic: `+`, `-`
    - Comparison: `==`, `!=`

    **Example:**
    ```
    x = 5 + 3
    y = x == 8
    ```

4. **Control Flow**: The language supports the following control flow statements:
    - `if` statement: Used for conditional execution of code blocks.
    - `while` loop: Used for repeated execution of code blocks.

Both statements must be followed by a code block enclosed in curly braces.

    **Example:**
    ```
    if x == 1 {
        x = 0
        y = 0
    }

    while x != 5 {
        y = y + 1
        if y == 5 {
            x = 1
            y = 0
        }
    }
    ```

5. **Functions**: Functions in this language must be declared before use. They can only contain alphanumeric characters and underscores, and must start with a letter, function parameters must be enclosed in parentheses.

    **Example:**
    ```
    function add(a, b) {
        return a + b
    }

    x = add(5, 3)
    ```

6. **Built-in Functions**: The language supports the following built-in functions:
    - `print()`: Used to output data to the output buffer.

    **Example:**
    ```
    print(10)
    ```

7. **Only One Statement Per Line**: Each statement in this language must be on a separate line.

    **Example:**
    ```
    x = 5
    y = 3
    ```

## Example Program
The following is an example program to output the first 10 numbers in the Fibonacci sequence:

```c
a = 0
b = 1
i = 0

while i != 10 {
    print(a)
    c = a + b
    a = b
    b = c
    i = i + 1
}
```


## Error Handling
The language currently does not have an advanced error handling system. Common errors, such as division by zero or referencing undeclared variables, will result in a compilation failure.


## Final Considerations
This documentation aims to provide a foundation for the future use and expansion of the language, keeping it accessible for beginners and useful for educational purposes.
