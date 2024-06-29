# Simulator of the comp88-v1.3 computer

# CONTROLER OUTPUT IN ORDER
from typing import List
from asm import AssemblerInstruction


def sv_reg8(value: int) -> int:
    if value < 0:
        print(f'Value out of range: {value}, underflows to {value % 256}')
    if value > 255:
        print(f'Value out of range: {value}, overflows to {value % 256}')
    return value % 256


class Comp8Emulator:

    def __init__(self, program: List[AssemblerInstruction], program_memory_size: int):
        if program_memory_size < len(program):
            raise ValueError(f'Program memory size is less than the program size: {program_memory_size} < {len(program)}')
        self.program = program
        self.memory_address = 0
        self.memory: List[int] = [0] * 16
        self.__registers = [0, 0]
        self.pc = 0
        self.output = 0
        self.clk_count = 0

    def clk(self) -> bool:
        instr = self.program[self.pc]
        reg = 0 if instr.register == 'A' else 1

        if instr.instruction == 'HLT':
            return False
        elif instr.instruction == 'OUT':
            self.output = sv_reg8(self.__registers[reg])
        elif instr.instruction == 'ADD':
            self.__registers[reg] = sv_reg8(self.__registers[0] + self.__registers[1])
        elif instr.instruction == 'SUB':
            self.__registers[reg] = sv_reg8(self.__registers[0] - self.__registers[1])
        elif instr.instruction == 'LD':
            self.__registers[reg] = sv_reg8(self.memory[self.memory_address])
        elif instr.instruction == 'ST':
            self.memory[self.memory_address] = sv_reg8(self.__registers[reg])
        elif instr.instruction == 'ADR':
            self.memory_address = sv_reg8(self.__registers[reg])
        elif instr.instruction == 'LDI':
            if isinstance(instr.immediate, int):
                self.__registers[reg] = sv_reg8(instr.immediate)
            else:
                raise ValueError(f'Invalid immediate value: {instr.immediate}')
        elif instr.instruction == 'LDIH':
            if isinstance(instr.immediate, int):
                self.__registers[reg] = sv_reg8(instr.immediate << 4)
            else:
                raise ValueError(f'Invalid immediate value: {instr.immediate}')
        elif instr.instruction == 'ADRI':
            if isinstance(instr.immediate, int):
                self.memory_address = sv_reg8(instr.immediate)
            else:
                raise ValueError(f'Invalid immediate value: {instr.immediate}')
        elif instr.instruction == 'BEQ':
            if isinstance(instr.immediate, int):
                if self.__registers[0] == self.__registers[1]:
                    self.pc = sv_reg8(instr.immediate)
                    self.pc -= 1
            else:
                raise ValueError(f'Invalid immediate value: {instr.immediate}')
        elif instr.instruction == 'JMP':
            if isinstance(instr.immediate, int):
                self.pc = sv_reg8(instr.immediate)
                self.pc -= 1
            else:
                raise ValueError(f'Invalid immediate value: {instr.immediate}')
        elif instr.instruction == 'JMPR':
            self.pc = sv_reg8(self.__registers[reg])
            self.pc -= 1
        else:
            raise ValueError(f'Invalid instruction: {instr.instruction}')
        self.clk_count += 1
        self.pc = sv_reg8(self.pc + 1)

        if self.pc >= len(self.program):
            return False
        
        return True
    
    def run(self):
        while self.clk():
            pass
        return self.output
    
    def reset(self):
        self.memory_address = 0
        self.memory = [0] * 16
        self.__registers = [0, 0]
        self.pc = 0
        self.output = 0
        self.clk_count = 0
        return self
    
    def __str__(self):
        return 'Comp8Emulator(\n\t'+\
            f'memory_address={self.memory_address},\n\t'+\
            f'memory={self.memory},\n\t'+\
            f'registers={self.__registers},\n\t'+\
            f'pc={self.pc},\n\t'+\
            f'output={self.output}\n\t'+\
            f'clk_count={self.clk_count}\n'+\
            ')'
    
    def __repr__(self):
        return str(self)
    

if __name__ == '__main__':
    
    import time
    import argparse

    parser = argparse.ArgumentParser(description='Simulator of the comp88-v1.3 computer')
    parser.add_argument('program', type=str, help='Program to run', nargs='?')
    parser.add_argument('--file', '-f', type=str, help='Program file to run')
    parser.add_argument('--debug', '-d', action='store_true', help='Print debug information')
    args = parser.parse_args()

    if args.file and args.program:
        raise ValueError('Only one of file or program can be provided.')
    
    if args.file:
        with open(args.file, 'r') as f:
            program = f.read()
    elif args.program:
        program = args.program
    else:
        raise ValueError('No program provided.')
    
    from asm import assembly_to_binary
    program = assembly_to_binary(program, immediate_bit_limit=4)

    if args.debug:
        print('Program:')
        print('Address', ' Instruction')
        for i, instr in enumerate(program):
            print(f'{i:7d}', instr)

    emulator = Comp8Emulator(program, program_memory_size=32)

    if args.debug:
        print('Running program...')
        while True:
            print(emulator)
            input(f"Next instruction: {program[emulator.pc]}, Press any key to advance the clock")
            if not emulator.clk():
                break
        print(emulator)
        print("Output:", emulator.output, "Clocks:", emulator.clk_count)

    else:
        return_value = emulator.run()
        print("Output:", return_value, "Clocks:", emulator.clk_count)