# ---------------------------------------------------
# | TYPE |  NAME  |  BITCONFIG   | CONTROLER OUTPUT |
# |------|--------|-012-3-4-56-7-|-II-AA-MMM-BB-APO-|
# |  O   | HLT    | --- 0 0 00 0 | 00 00 000 00 000 |  halts (dont actually halt, but nothing is done)
# |  O   | OUT    | --- 0 0 01 0 | 00 10 000 00 001 |  write data in A to output buffer
# |  O   | OUT    | --- 0 0 01 1 | 00 00 000 10 001 |  write data in B to output buffer
# |  O   | ADD    | --- 0 0 10 0 | 00 11 000 10 000 |  A = A + B    
# |  O   | ADD    | --- 0 0 10 1 | 00 10 000 11 000 |  B = A + B    
# |  O   | SUB    | --- 0 0 11 0 | 00 11 000 10 100 |  A = A - B
# |  O   | SUB    | --- 0 0 11 1 | 00 10 000 11 100 |  B = A - B
# |  M   | LD A   | --- 1 0 00 0 | 00 01 100 00 000 |  load memory DATA at current address to A
# |  M   | LD B   | --- 1 0 00 1 | 00 00 100 01 000 |  load memory DATA at current address to B
# |  M   | ST A   | --- 1 0 10 0 | 00 10 010 00 000 |  store A DATA to memory at current address
# |  M   | ST B   | --- 1 0 10 1 | 00 00 010 10 000 |  store B DATA to memory at current address
# |  M   | ADR A  | --- 1 0 01 0 | 00 10 001 00 000 |  set the memory ADDRESS to A
# |  M   | ADR B  | --- 1 0 01 1 | 00 00 001 10 000 |  set the memory ADDRESS to B
# |  M   | JMPR A | --- 1 0 11 0 | 00 10 000 00 010 |  set PC the value loaded to register A
# |  M   | JMPR B | --- 1 0 11 1 | 00 00 000 10 010 |  set PC the value loaded to register B
# |  I   | LDI  A | <imm> 1 10 0 | 01 01 000 00 000 |  load immediate to A (lower significant bits)
# |  I   | LDI  B | <imm> 1 10 1 | 01 00 000 01 000 |  load immediate to B (lower significant bits)
# |  I   | LDIH A | <imm> 1 01 0 | 11 01 000 00 000 |  load immediate to A (higher significant bits)
# |  I   | LDIH B | <imm> 1 01 1 | 11 00 000 01 000 |  load immediate to B (higher significant bits)
# |  I   | ADRI   | <imm> 1 00 0 | 01 00 001 00 000 |  set immediate to memory ADDRESS
# |  I   | BEQ    | <imm> 1 11 0 | 01 10 000 00 1?0 |  if A = B PC is set to immediate value, else continue.
# |  I   | JMP    | <imm> 1 11 1 | 01 00 000 00 010 |  set PC to immediate value.
# ---------------------------------------------------

INSTRUCTION_SET = {
    'HLT':    0b00000000,
    'OUT':    0b00000010,
    'ADD':    0b00000100,
    'SUB':    0b00000110,
    'LD':     0b00010000,
    'ST':     0b00010100,
    'ADR':    0b00010010,
    'JMPR':   0b00010110,
    'LDI':    0b00001100, # I
    'LDIH':   0b00001010, # I
    'ADRI':   0b00001000, # I
    'BEQ':    0b00001110, # | 0b000000000010 if A = B
    'JMP':    0b00001111, # I
}

BINARY_TO_INSTRUCTION = {v: k for k, v in INSTRUCTION_SET.items()}

# CONTROLER OUTPUT IN ORDER
IMM2BUS_H = 0b100000000000
IMM2BUS   = 0b010000000000
A_READ    = 0b001000000000
A_WRITE   = 0b000100000000
M_READ    = 0b000010000000
M_WRITE   = 0b000001000000
MR_WRITE  = 0b000000100000
B_READ    = 0b000000010000
B_WRITE   = 0b000000001000
ALU_OP    = 0b000000000100
PC_WRITE  = 0b000000000010
OUT_WRITE = 0b000000000001


INSTRUCTIONS_IMM_ARG = ['LDI', 'LDIH', 'ADRI', 'BEQ', 'JMP']


INSTRUCTIONS_REG_ARG =\
    ['OUT', 'ADD', 'SUB', 'LD', 'ST', 'ADR', 'JMPR', 'LDI', 'LDIH']


def endian_change(data: int, bits: int) -> int:
    return int(f'{data:0{bits}b}'[::-1], 2)