from dataclasses import dataclass
from typing import Dict, List
from utils import INSTRUCTION_SET, INSTRUCTIONS_REG_ARG, INSTRUCTIONS_IMM_ARG

@dataclass
class AssemblerInstruction:
    line_no: int
    label: str | None
    instruction: str
    register: str | None
    immediate: str | int | None
    binary: int | None = None

    def __str__(self):
        li_no = f'{self.line_no:3}'
        if self.label:
            label = f'{self.label:>6}:' if self.label else ' '*6 + ':'
        else:
            label = ' '*7
        instr = f'{self.instruction:4}'
        reg = f'{self.register:1}' if self.register else ' '*1
        imm = f'{self.immediate:<2}' if self.immediate else ' '*2
        bin = f'{self.binary:08b}' if self.binary else ' '*8
        if self.register:
            return f'{li_no}| {label} {instr} {reg} {imm} | {bin}'
        else:
        
            return f'{li_no}| {label} {instr} {imm} {reg} | {bin}'
        

def assembly_to_binary(assembly: str, immediate_bit_limit: int) -> List[AssemblerInstruction]:
    '''
    Convert assembly code to binary code

    Args:
        assembly (str): Multiline string containing assembly code

    Returns:
        List[AssemblerInstruction]: List of AssemblerInstruction objects
    '''

    instructions: List[AssemblerInstruction] = []
    label_used: Dict[str, bool] = {}
    
    temp_label: str | None = None
    for i, line in enumerate(assembly.split('\n')):

        instruction = None
        register = None
        immediate = None
    
        line = line.strip()
        # Skip empty lines
        if not line:
            continue
        # Skip comments
        if line[0] == '#':
            continue

        if ':' in line:
            temp_label, line = line.split(':')
            temp_label = temp_label.strip()
            line = line.strip()
            if not line:
                continue
       
        # Split the line into tokens
        tokens = line.split()

        # Check if the first token is an instruction
        if tokens[0] in INSTRUCTION_SET:
            instruction = tokens[0]
            tokens = tokens[1:]
        else:
            raise ValueError(f"Invalid instruction: '{tokens[0]}' at line {i+1}")
        
        # Check if the instruction has a register argument
        if instruction in INSTRUCTIONS_REG_ARG:
            if len(tokens) < 1:
                raise ValueError(f"Invalid number of arguments for instruction '{instruction}' at line {i+1}: {line}")
            register = tokens[0]
            if register not in ['A', 'B']:
                raise ValueError(f'Invalid register: {register} at line {i+1}: {line}')
            tokens = tokens[1:]
        else:
            register = None

        # Check if the instruction has an immediate argument
        if instruction in INSTRUCTIONS_IMM_ARG:
            if len(tokens) < 1:
                raise ValueError(f"Invalid number of arguments for instruction '{instruction}' at line {i+1}: {line}, token: {tokens}")
            try:
                immediate = int(tokens[0])
                if immediate < 0 or immediate > 15:
                    raise ValueError(f"Invalid immediate value: '{immediate}'" + f" at line {i+1}: {line}")
            except ValueError:
                immediate = tokens[0]
            tokens = tokens[1:]
        else:
            immediate = None
        
        if len(tokens) > 0:
            if not tokens[0][0] == '#':
                raise ValueError(f"Invalid argument: '{tokens[0]}' at line {i+1}: {line}")
        
        if temp_label:
            if temp_label in label_used:
                raise ValueError(f"Error defining label at line {i+1}, label '{temp_label}' already defined.")
            label_used[temp_label] = False
        instruction = AssemblerInstruction(i+1, temp_label, instruction, register, immediate)
        instructions.append(instruction)
        temp_label = None
    
    for instruction in instructions:
        if isinstance(instruction.immediate, str):
            if instruction.immediate not in label_used:
                raise ValueError(f"Label '{instruction.immediate}' not defined")
            label_used[instruction.immediate] = True
            for i, ins in enumerate(instructions):
                if instruction.immediate == ins.label:
                    instruction.immediate = i
                    break
            else:
                raise Exception(f"Critical Error: Label '{instruction.immediate}' not found.")
    
    for label, used in label_used.items():
        if not used:
            raise ValueError(f"Label '{label}' defined but not used.")
        
    for instruction in instructions:
        instruction.binary = INSTRUCTION_SET[instruction.instruction]
        if instruction.register:
            instruction.binary |= 0b00000001 if instruction.register == 'B' else 0
        if instruction.immediate is not None:
            if isinstance(instruction.immediate, str):
                imm = int(instruction.immediate)
            else:
                imm = instruction.immediate
            if imm > 2**immediate_bit_limit - 1 or imm < 0:
                raise ValueError(f"Immediate value '{imm}' out of range at line {instruction.line_no}")
            # Reverse the bits of the immediate value as the processor is little-endian
            imm = int(f'{imm:04b}'[::-1], 2)
            instruction.binary |= imm << 4

    return instructions


if __name__ == '__main__':

    import argparse

    parser = argparse.ArgumentParser(description='Convert assembly code to binary code')
    parser.add_argument('assembly', type=str, help='Assembly code to convert', nargs='?')
    parser.add_argument('--file', '-f', type=str, help='Assembly file to convert')
    parser.add_argument('--output', '-o', type=str, help='Output file to save the binary code')
    parser.add_argument('--debug', '-d', action='store_true', help='Print debug information')

    args = parser.parse_args()

    if args.file and args.assembly:
        raise ValueError('Only one of file or assembly can be provided.')

    if args.file:
        with open(args.file, 'r') as f:
            assembly = f.read()
    elif args.assembly:
        assembly = args.assembly
    else:
        raise ValueError('No assembly code provided.')

    instructions = assembly_to_binary(assembly, immediate_bit_limit=4)


    if args.output:
        with open(args.output, 'w') as f:
            for instruction in instructions:
                f.write(f'{instruction.binary:08b}\n')
    else:
        for instruction in instructions:
            if args.debug:
                print(instruction)
            else:
                print(f'{instruction.binary:08b}')


