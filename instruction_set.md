COMP88-v1.3

INSTRUCTION           | DESCRIPTION
----------------------|----------------------------------------------------------------
HLT                   | halts
OUT  \<reg>           | write data in register <A|B> to output buffer
ADD  \<reg>           | add A and B and store the result to register <A|B> = A + B    
SUB  \<reg>           | subtract B from A and store the result to register <A|B> = A - B    
LD   \<reg>           | load memory DATA at current memory address to register <A|B>
ST   \<reg>           | store register DATA to memory at current memory address <A|B>
ADR  \<reg>           | set the memory ADDRESS to value stored at register <A|B>
LDI  \<reg> \<imm>    | load 4bit immediate to register <A|B> less significant bits
LDIH \<reg> \<imm>    | load 4bit immediate to register <A|B> highest significant bits
ADRI \<imm>           | set immediate to memory ADDRESS
BEQ  \<imm>           | if A = B PC is set to immediate value, else continue.
JMP  \<imm>           | set PC to immediate value.
JMPR \<reg>           | set PC to the value stored in the register <A|B>


EXAMPLE PROGRAM
FIBONACCI SEQUENCE
ASSEMBLY      BINARY
--------------------------
LDI A 1       1000 1100
LDI B 1       1000 1101
LOOP:
ST  A         0001 0100
ADD A         0000 0100
OUT A         0000 0001
LD  B         0001 0001
JMP LOOP      0100 1111

-----------------------------------------------------------
| TYPE | CODE |                  LAYOUT                   |
|------|------|-------------------------------------------|
|  O   |  0   | 0-2 -| 3 code | 4 type | 5-6 code | 7 reg |
|  I   |  1   |    0-3 imm    | 4 type | 5-6 code | 7 op  |
-----------------------------------------------------------

---------------------------------------------------
| TYPE |  NAME  |  BITCONFIG   | CONTROLER OUTPUT |
|------|--------|--------------|------------------|
|  O   | HLT    | --- 0 0 00 0 | 00 00 000 00 000 |  halts
|  O   | OUT A  | --- 0 0 01 0 | 00 10 000 00 001 |  write data in A to output buffer
|  O   | OUT B  | --- 0 0 01 0 | 00 00 000 10 001 |  write data in B to output buffer
|  O   | ADD A  | --- 0 0 10 0 | 00 11 000 10 000 |  A = A + B  
|  O   | ADD B  | --- 0 0 10 0 | 00 10 000 11 000 |  B = A + B  
|  O   | SUB A  | --- 0 0 11 0 | 00 11 000 10 100 |  A = A - B
|  O   | SUB B  | --- 0 0 11 0 | 00 10 000 11 100 |  B = A - B
|  M   | LD A   | --- 1 0 00 0 | 00 01 100 00 000 |  load memory DATA at current address to A
|  M   | LD B   | --- 1 0 00 0 | 00 00 100 01 000 |  load memory DATA at current address to B
|  M   | ST A   | --- 1 0 10 0 | 00 10 010 00 000 |  store A DATA to memory at current address
|  M   | ST B   | --- 1 0 10 0 | 00 00 010 10 000 |  store B DATA to memory at current address
|  M   | ADR A  | --- 1 0 01 0 | 00 10 001 00 000 |  set the memory ADDRESS to A
|  M   | ADR B  | --- 1 0 01 0 | 00 00 001 10 000 |  set the memory ADDRESS to B
|  M   | JMPR A | --- 1 0 11 0 | 00 10 000 00 010 |  set PC the value loaded to register A
|  M   | JMPR B | --- 1 0 11 0 | 00 00 000 10 010 |  set PC the value loaded to register B
|  I   | LDI  A | <imm> 1 10 0 | 01 01 000 00 000 |  load immediate to A (lower significant bits)
|  I   | LDI  B | <imm> 1 10 0 | 01 00 000 01 000 |  load immediate to B (lower significant bits)
|  I   | LDIH A | <imm> 1 01 0 | 11 01 000 00 000 |  load immediate to A (higher significant bits)
|  I   | LDIH B | <imm> 1 01 0 | 11 00 000 01 000 |  load immediate to B (higher significant bits)
|  I   | ADRI   | <imm> 1 00 0 | 01 00 001 00 000 |  set immediate to memory ADDRESS
|  I   | BEQ    | <imm> 1 11 0 | 01 10 000 10 1?0 |  if A = B PC is set to immediate value, else continue.
|  I   | JMP    | <imm> 1 11 1 | 01 00 000 00 010 |  set PC to immediate value.
---------------------------------------------------

CONTROLER OUTPUT IN ORDER
IMM2BUS_H
IMM2BUS
A_READ 
A_WRITE
B_READ (NAO VAI PARA A BUS)
B_WRITE
M_READ
M_WRITE
MR_WRITE  
ALU_OP
PC_WRITE
OUT_WRITE

=======================================================

COMPILER.js
```js
INSTRUCTION_SET = {
	"HLT":   "xxx0 0000",
	"OUT":   "xxx0 001R",
	"ADD":   "xxx0 010R",
	"SUB":   "xxx0 011R",
	"LD":    "xxx1 000R",
	"ST":    "xxx1 010R",
	"ADR":   "xxx1 001R",
	"JMPR":  "xxx1 011R",
  "LDI":   "iiii 110R",
	"LDIH":  "iiii 101R",
	"ADRI":  "iiii 1000",
	"BEQ":   "iiii 1110",
  "JMP":   "iiii 1111"
}

function getComponent(name){
  return components.filter(e=>e.ccomp.name==name);
}

function parse_imm(imm){
  if (typeof(imm)==="string"){
    imm = Number.parseInt(imm);
  }
  return (imm+16).toString(2).substring(1).split("").reverse().join("");
}


function parseAssemblyLine(line){
  const tokens = line.toUpperCase().replace(/\s+/g,' ').replace(/^\s*/g,'').split(' ');
  let bin = INSTRUCTION_SET[tokens[0]].replaceAll(' ', '');
  bin = bin.replaceAll("x", "0");
  if (bin.includes("R")){
    bin = bin.replace("R", tokens[1]=="A"?"0":"1");
    if (bin[4] === "1"){
      bin = bin.replace("iiii", parse_imm(tokens[2]));
    }
  }
  else {
     if (bin[4] === "1"){
       bin = bin.replace("iiii", parse_imm(tokens[1]));
     }
  }
  return bin;
}

function parseAssembly(string){
  const raw_lines = string.split('\n');
  const ref = [];
  const instructions = [];
  const binary = [];
  const blocks = {};
  let ln = 0;
  for (const l of raw_lines){
    const line = l.toUpperCase().replace(/\s+/g,' ').replace(/^\s*/g,'').replace(/\s*$/g,'');
    if (line.length === 0) continue;
    try {
      binary.push(parseAssemblyLine(line));
      instructions.push(line);
      ref.push({ln, ref: l});
    }
    catch {
      if (line.includes(":")){
        blocks[line.replace(':', '')] = instructions.length;
      }
      else {
        throw new Error("Invalid instruction at line " + ln);
      }
    }
    ln++;
  }
  for (const i in instructions){
    for (const block in blocks){
      instructions[i] = instructions[i].replace(block, blocks[block]);
      binary[i] = parseAssemblyLine(instructions[i]);
    }
  }
  return {ref, instructions, binary, blocks}
}

function binaryInstructionImmToDec(binary_line){
  // binary_line is a string of 8 bits
  return Number.parseInt(binary_line.substring(0, 4).split("").reverse().join(""), 2);
}
function binaryToAssembly(binary){
  let assembly = [];
  for (const b of binary){
    for (const instruction in INSTRUCTION_SET){
      ref_bin = INSTRUCTION_SET[instruction].replaceAll(' ', '');
      if (b[4] === "1"){
        // IMMEDIATE INSTRUCTION
        if (ref_bin[7] === "R" && ref_bin.substring(4, 7) === b.substring(4, 7)){
          register = b[7] === "0"?"A":"B";
          imm = binaryInstructionImmToDec(b);
          assembly.push(instruction + " " + register + " " + imm);
          break;
        }
        else if (ref_bin.substring(4, 8) === b.substring(4, 8)){
          imm = binaryInstructionImmToDec(b);
          assembly.push(instruction + " " + imm);
          break;
        }
      }
      else {
        if (ref_bin[7] === "R" && ref_bin.substring(3, 7) === b.substring(3, 7)){
          register = b[7] === "0"?"A":"B";
          assembly.push(instruction + " " + register);
          break;
        }
        else if (ref_bin.substring(3, 8) === b.substring(3, 8)){
          assembly.push(instruction);
          break;
        }
      }
    }
  }
  return assembly;
}

function address_list(address_number, slots){
  return (address_number+1024).toString(2).split('').reverse().join('')
	.substr(0, slots).split('').map(e=>(Number.parseInt(e)));
}

function instructionLoader(component, prog_text, writeNodeId, clkNodeId, addressNodeIds, binaryNodeIds, speed, callback){
  component.writeNodeStatesByIdList([writeNodeId, clkNodeId], [1, 0]);
  prog = parseAssembly(prog_text);
  console.log(prog)
  let i = 0;
  let address = 0;
  const interval = setInterval(()=>{
    try {
      if (i === prog.binary.length*3){
	      clearInterval(interval);
        component.writeNodeStatesByIdList([writeNodeId], [0]);
        component.writeNodeStatesByIdList(addressNodeIds, address_list(0, addressNodeIds.length));
        component.writeNodeStatesByIdList(binaryNodeIds, address_list(0, binaryNodeIds.length));
        setTimeout(()=>{callback?.()}, 50);
        console.log("Finished");
      }
      else if (i % 3 === 0){
        component.writeNodeStatesByIdList(addressNodeIds, address_list(address, addressNodeIds.length));
        component.writeNodeStatesByIdList(binaryNodeIds, prog.binary[address].split("").map(e=>Number.parseInt(e))); 
      }
      else if (i % 3 === 1) {
         component.writeNodeStatesByIdList([clkNodeId], [1]);
         console.log(address, prog.binary[address],"  ", prog.instructions[address]);
         address++;
      }
      else {
         component.writeNodeStatesByIdList([clkNodeId], [0]);
      }
      i++;
    }
    catch(e){
      console.log(e);
      clearInterval(interval);
    }
  }, speed);
  return prog;
}

function instructionExtractor(component, addressNodeIds, binaryNodeIds, n_lines, speed, callback){
  binary = [];
  let i = 0;
  let address = 0;
  const interval = setInterval(()=>{
    try {
      if (i === n_lines*2){
        clearInterval(interval);
        component.writeNodeStatesByIdList(addressNodeIds, address_list(0, addressNodeIds.length));
        assembly = binaryToAssembly(binary)
        console.log(assembly);
        setTimeout(()=>{callback?.(assembly)}, 50);
      }
      else if (i % 2 === 0){
        component.writeNodeStatesByIdList(addressNodeIds, address_list(address, addressNodeIds.length));
      }
      else {
         binary.push(component.readNodeStatesByIdList(binaryNodeIds).join(""));
         address++;
      }
      i++;
    }
    catch(e){
      console.log(e);
      clearInterval(interval);
    }
  }, speed);
}

function run(max_it, speed){
    const clk = getComponent("IO").filter(e=>e.ccomp.inputs[0].id=="CLK")[0].getNodeById("CLK");
    let i = 0;
    const interval = setInterval(()=>{
       clk.write(!clk.read());
       i++;
       if (i >= max_it*2){
          clearInterval(interval);
       }
    }, speed);
    return interval;
}

function reset(callback){
	const reset = getComponent("IO").filter(e=>e.ccomp.inputs[0].id=="RESET")[0].getNodeById("RESET");
	const clk = getComponent("IO").filter(e=>e.ccomp.inputs[0].id=="CLK")[0].getNodeById("CLK");
        clk.write(0);
	reset.write(1);
	setTimeout(()=>(
		clk.write(1)
	), 100);
	setTimeout(()=>{
		clk.write(0);
		reset.write(0);
	}, 200);
}

let comp = getComponent("MEM32")[0];
let write = "W"
let clk = "clk"
let addressNodeIds = ["s0","s1","s2","s3","s4"];
let mem32outputIds = ["d0","d1","d2","d3","d4","d5","d6","d7"]
let binaryNodeIds = ["X0", "X1", "X2", "X3", "X4", "X5", "X6", "X7"];

function load(prog, callback){
  return instructionLoader(comp, prog, write, clk, addressNodeIds, binaryNodeIds, 100, callback);
}

function extract(n_lines, callback){
  return instructionExtractor(comp, addressNodeIds, mem32outputIds, n_lines, 100, callback);
}

function exec(line){
  load(line, ()=>{run(1, 200);});
}


prog_text = `
LDI  A 5

JMP PROG_BEGIN	
PROG_END:
ADRI 1		
LD   A
OUT	 A
HLT

PROG_BEGIN:
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
BEQ  PROG_END
ST   A
JMP  LOOP
`

load(prog_text);


```