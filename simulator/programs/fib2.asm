# Argumento representando o indice do numero fibonacci a ser retornador
LDI  A 5

# Inicio do programa
JMP BEGIN

END:
ADRI 1		
LD   A
OUT	 A
HLT

BEGIN:
ADRI 0
LDI  B 1	
ST   A			
ADRI 1		
ST   B	   
ADRI 2
ST   B

LOOP:
ADRI 1
LD   A
ADRI 2
LD   B
ST   A
ADD  A
ADRI 1
ST   A
ADRI 0
LD   A
LDI  B 1
SUB  A
BEQ  END
ST   A
JMP  LOOP