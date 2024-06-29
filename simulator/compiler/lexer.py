import ply.lex as lex

# List of token names
tokens = [
    'NUMBER', 'PLUS', 'MINUS', 'EQUALS', 'IF', 'WHILE', 'IDENTIFIER',
    'FUNCTION', 'LPAREN', 'RPAREN', 'LBRACE', 'RBRACE', 'COMMA',
    'RETURN', 'NEQUALS', 'DEQUALS'
]

# Regular expression rules for tokens
t_PLUS = r'\+'
t_MINUS = r'-'
t_EQUALS = r'='
t_LPAREN = r'\('
t_RPAREN = r'\)'
t_LBRACE = r'\{'
t_RBRACE = r'\}'
t_COMMA = r','
t_NEQUALS = r'!='
t_DEQUALS = r'=='

def t_newline(t):
    r'\n+'
    t.lexer.lineno += len(t.value)
    t.lexpos = 0

def t_FUNCTION(t):
    r'function'
    return t

def t_NUMBER(t):
    r'\d+'
    t.value = int(t.value)
    return t

def t_IF(t):
    r'if'
    return t

def t_WHILE(t):
    r'while'
    return t

def t_RETURN(t):
    r'return'
    return t

def t_IDENTIFIER(t):
    r'[a-zA-Z_][a-zA-Z0-9_]*'
    return t

# Ignored characters
t_ignore = ' \t'

# Error handling rule
def t_error(t):
    print(f"Illegal character '{t.value[0]}'")
    t.lexer.skip(1)

# Build the lexer
lexer = lex.lex()

# Test the lexer
if __name__ == '__main__':
    
    import sys

    if len(sys.argv) != 2:
        print("Usage: python lexer.py <filename>")
        sys.exit(1)

    with open(sys.argv[1], 'r') as f:
        data = f.read()

    lexer.input(data)
    for tok in lexer:
        print(tok)
