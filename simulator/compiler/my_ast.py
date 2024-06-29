import ply.yacc as yacc
from lexer import tokens

def p_program(p):
    'program : statement_list'
    p[0] = ('program', p[1])

def p_statement_list(p):
    '''
    statement_list : statement_list statement
                   | statement
    '''
    if len(p) == 3:
        p[0] = p[1] + [p[2]]
    else:
        p[0] = [p[1]]

def p_statement(p):
    '''
    statement : assignment_statement
              | if_statement
              | while_statement
              | function_declaration
              | function_call
    '''
    p[0] = p[1]

def p_assignment_statement(p):
    'assignment_statement : IDENTIFIER EQUALS expression'
    p[0] = ('assign', p[1], p[3])

def p_if_statement(p):
    'if_statement : IF expression LBRACE statement_list RBRACE'
    p[0] = ('if', p[2], p[4])

def p_while_statement(p):
    'while_statement : WHILE expression LBRACE statement_list RBRACE'
    p[0] = ('while', p[2], p[4])

def p_function_declaration(p):
    'function_declaration : FUNCTION IDENTIFIER LPAREN parameter_list RPAREN LBRACE function_body RBRACE'
    p[0] = ('function_declaration', p[2], p[4], p[7])

def p_function_body(p):
    '''
    function_body : function_body statement
                  | statement
                  | return_statement
                  | empty
    '''
    if len(p) == 3:
        p[0] = p[1] + [p[2]]
    else:
        p[0] = [p[1]]

def p_return_statement(p):
    'return_statement : RETURN expression'
    p[0] = ('return', p[2])

def p_function_call(p):
    'function_call : IDENTIFIER LPAREN argument_list RPAREN'
    p[0] = ('call', p[1], p[3])

def p_parameter_list(p):
    '''
    parameter_list : parameter_list COMMA IDENTIFIER
                   | IDENTIFIER
                   | empty
    '''
    if len(p) == 4:
        p[0] = p[1] + [p[3]]
    elif len(p) == 2:
        p[0] = [p[1]]
    else:
        p[0] = []

def p_argument_list(p):
    '''
    argument_list : argument_list COMMA expression
                  | expression
                  | empty
    '''
    if len(p) == 4:
        p[0] = p[1] + [p[3]]
    elif len(p) == 2:
        p[0] = [p[1]]
    else:
        p[0] = []

def p_expression(p):
    '''
    expression : expression op expression
               | LPAREN expression RPAREN
               | IDENTIFIER
               | NUMBER
               | function_call
    '''
    if len(p) == 4:
        if p[1] == '(':
            p[0] = p[2]
        else:
            p[0] = ('op', p[1], p[2], p[3])
    elif len(p) == 3:
        p[0] = p[2]
    else:
        p[0] = p[1]

def p_op(p):
    '''
    op : PLUS
       | MINUS
       | DEQUALS
       | NEQUALS
    '''
    p[0] = p[1]

def p_empty(p):
    'empty :'
    pass

def p_error(p):
    if p:
        # Print the error message
        print(f"Syntax error at {p.value!r} in line {p.lineno}")
        # Print the token where the error occurred
        print(f"Token: {p.type}")
        # Print the line where the error occurred
        print(p.lexer.lexdata.split('\n')[p.lineno-1], end='\n\n')
    else:
        print("Syntax error at EOF")

# Build the parser
ast_parser = yacc.yacc(
    start='program',
    debug=False,
    write_tables=False
)

def parse(data):
    return ast_parser.parse(data)

if __name__ == '__main__':
    
    import sys

    if len(sys.argv) != 2:
        print("Usage: python parser.py <filename>")
        sys.exit(1)

    with open(sys.argv[1], 'r') as f:
        data = f.read()

    result = parse(data)
    
    tab_size = 4

    def print_ast(ast, level=0):
        if isinstance(ast, tuple):
            print(' ' * tab_size * level, ast[0])
            for i in range(1, len(ast)):
                print_ast(ast[i], level + 1)
        elif isinstance(ast, list):
            for i in ast:
                print_ast(i, level)
        else:
            print(' ' * tab_size * level, ast)

    print_ast(result)