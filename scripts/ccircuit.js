class CComponent {

	constructor(name){
		this.name = name;
		this.inputs = [];
		this.outputs = [];
	}

	eval(){}

	update(){
		this.eval();
		this.commit();
	}

	input(arr){
		for (let n of this.getAllNodes()){
			n.reset();
		}
		for (let i = 0; i < arr.length; i++){
			this.getNode(i).write(arr[i]);
		}
		return this.output();
	}

	output(){
		let output = []
		for (let i = this.inputs.length; i < this.inputs.length+this.outputs.length; i++){
			output.push(this.getNode(i).read());
		}
		return output;
	}

	flow(arr, updates){
		this.input(arr);
		for (let i = 0; i < updates; i++){
			this.update();
		}
		return this.output();
	}

	getNode(id){
		if (id < this.inputs.length){
			return this.inputs[id];
		}
		id -= this.inputs.length;
		if (id < this.outputs.length){
			return this.outputs[id];
		}
		return null;
	}

	getNodes(){
		return this.inputs.concat(this.outputs);
	}

	getAllNodes(){
		return this.getNodes();
	}

	toJSON(){
		return {
			name: this.name,
			inputs: this.inputs.map((e)=>{return e.id}),
			outputs: this.outputs.map((e)=>{return e.id}),
		};
	}

	toString(){
		return '{'+this.name+
		', inputs: ['+this.inputs.map(e=>{return e.state})+
		']  outputs: ['+this.outputs.map(e=>{return e.state})+']}';
	}

	_createNode(id, type){
		if (type == CNode.INPUT){
			let node = new CNode(id, CNode.INPUT, this);
			this.inputs.push(node);
			return node;
		}
		else if (type == CNode.OUTPUT){
			let node = new CNode(id, CNode.OUTPUT, this);
			this.outputs.push(node);
			return node;
		}
		throw "Invalid CNode type";
	}
}

class AND extends CComponent {
	constructor(){
		super('AND');
		this._createNode('A', CNode.INPUT);
		this._createNode('B', CNode.INPUT);
		this._createNode('C', CNode.OUTPUT);
	}
	update(){
		if (this.inputs[0].read()==1 && this.inputs[1].read()==1)
			this.outputs[0].write(1);
		else
			this.outputs[0].write(0);
	}
}

class NOT extends CComponent{
	constructor(){
		super('NOT');
		this._createNode('A', CNode.INPUT);
		this._createNode('B', CNode.OUTPUT);
	}
	update(){
		if (this.inputs[0].read()==1)
			this.outputs[0].write(0);
		else
			this.outputs[0].write(1);
	}
}

class IO extends CComponent{
	constructor(){
		super('IO');
		this._createNode('A', CNode.INPUT);
		this._createNode('A', CNode.OUTPUT);
	}
	update(){
		this.outputs[0].write(this.inputs[0].read());
	}
}

class CCircuit extends CComponent {

	static components = {};

	static fromJSON(comp_name_or_json){
		if (typeof comp_name_or_json === 'string'){
			if (comp_name_or_json === 'AND') return new AND();
			else if (comp_name_or_json === 'NOT') return new NOT();
			else if (comp_name_or_json === 'IO') return new	IO();
			return CCircuit.fromJSON(CCircuit.components[comp_name_or_json]);
		}
		let json = comp_name_or_json;
		let circuit = new CCircuit(json.name);
		for (let comp of json.components){
			let c = CCircuit.fromJSON(comp);
			if (c){
				circuit.components.push(c);
				for (let n of c.inputs){
					n._component = c;
				}
				for (let n of c.outputs){
					n._component = c;
				}
			}
			else{
				console.log('Component '+comp+' nao encontrado')
			}
		}
		for (let id of json.inputs){
			let n = circuit.components[id[0]].getNode(id[1]);
			n.id = id[2];
			circuit.inputs.push(n);
		}
		for (let id of json.outputs){
			let n = circuit.components[id[0]].getNode(id[1]);
			n.id = id[2];
			circuit.outputs.push(n);
		}
		for (let con of json.connections){
			let n1 = circuit.getNode(con[0]);
			let n2 = circuit.getNode(con[1]);
			if (!n1.connect(n2)){
				console.err("ERRO AO CONECTAR NODES");
			}
		}
		CCircuit.components[json.name] = json;
		return circuit;
	}

	constructor(name, components){
		super(name);
		this.inputs = [];
		this.outputs = [];
		this.components = components??[];
		//find outputs and inputs
		for (let ci=0; ci < this.components.length; ci++){
			let c = this.components[ci];
			for (let i = 0; i < c.inputs.length; i++){
				let n = c.inputs[i];
				n._component = c;
				if (!n.hasConnection()){
					this.inputs.push([ci, i, n.id]);
				}
			}
			for (let i = 0; i < c.outputs.length; i++){
				let n = c.outputs[i];
				n._component = c;
				if (!n.hasConnection()){
					this.outputs.push([ci, i+c.inputs.length, n.id]);
				}
			}
		}
	}

	getNode(ni){
		if (ni instanceof Array){
			return this.components[ni[0]].getNode(ni[1]);
		}
		let n = super.getNode(ni);
		if (n){
			if (n instanceof CNode) return n;
			return this.getNode(n);
		}
		return n;
	}

	connections(){
		let connections = [];
		for (let ci = 0; ci < this.components.length; ci++){
			let c = this.components[ci];
			for (let ni = 0; ni < c.outputs.length; ni++){
				let n = c.outputs[ni];
				let n1code = [ci, c.inputs.length+ni];
				for (let con of n.connections){
					let n2code = [this.components.indexOf(con._component), con._component.inputs.indexOf(con)]
					connections.push([n1code, n2code]);
				}
			}
		}
		return connections;
	}

	update(){
		for (let c of this.components){
			c.update();
		}
	}

	getAllNodes(){
		if (this._all_nodes == undefined){
			this._all_nodes = [];
			for (let c of this.components){
				this._all_nodes = this._all_nodes.concat(c.getAllNodes());
			}
		}
		return this._all_nodes;
	}

	toJSON(){
		return {
			name: this.name,
			components: this.components.map((e)=>{return e.name}),
			connections: this.connections(),
			inputs: this.inputs.map(e=>{return [e[0], e[1], this.getNode(e)?.id]}),
			outputs: this.outputs.map(e=>{return [e[0], e[1], this.getNode(e)?.id]}),
		};
	}
}




function test(){

	nor_n1 = new NOT();
	nor_n2 = new NOT();
	nor_and = new AND();
	nor_n1.outputs[0].connect(nor_and.inputs[0]);
	nor_n2.outputs[0].connect(nor_and.inputs[1]);
	NOR = new CCircuit('NOR', [nor_n1, nor_n2, nor_and]);

	if(NOR.flow([0,0],5)[0]!=1)throw"ERROR";
	if(NOR.flow([1,0],5)[0]!=0)throw"ERROR";
	if(NOR.flow([0,1],5)[0]!=0)throw"ERROR";
	if(NOR.flow([1,1],5)[0]!=0)throw"ERROR";
	nor = CCircuit.fromJSON(NOR.toJSON());
	if(nor.flow([0,0],5)[0]!=1)throw"ERROR";
	if(nor.flow([1,0],5)[0]!=0)throw"ERROR";
	if(nor.flow([0,1],5)[0]!=0)throw"ERROR";
	if(nor.flow([1,1],5)[0]!=0)throw"ERROR";

	or_nor = CCircuit.fromJSON(NOR.toJSON());
	or_n = new NOT();
	or_nor.outputs[0].connect(or_n.inputs[0]);
	OR = new CCircuit('OR', [or_nor, or_n]);

	if(OR.flow([0,0],5)[0]!=0)throw"ERROR";
	if(OR.flow([1,0],5)[0]!=1)throw"ERROR";
	if(OR.flow([0,1],5)[0]!=1)throw"ERROR";
	if(OR.flow([1,1],5)[0]!=1)throw"ERROR";
	or = CCircuit.fromJSON(OR.toJSON());
	if(or.flow([0,0],5)[0]!=0)throw"ERROR";
	if(or.flow([1,0],5)[0]!=1)throw"ERROR";
	if(or.flow([0,1],5)[0]!=1)throw"ERROR";
	if(or.flow([1,1],5)[0]!=1)throw"ERROR";

	xor_io1 = new IO();
	xor_io2 = new IO();
	xor_n1 = new NOT();
	xor_n2 = new NOT();
	xor_and1 = new AND();
	xor_and2 = new AND();
	xor_or = CCircuit.fromJSON(OR.toJSON());
	xor_io1.outputs[0].connect(xor_and1.inputs[0]);
	xor_io1.outputs[0].connect(xor_n2.inputs[0]);
	xor_io2.outputs[0].connect(xor_and2.inputs[1]);
	xor_io2.outputs[0].connect(xor_n1.inputs[0]);
	xor_n1.outputs[0].connect(xor_and1.inputs[1]);
	xor_n2.outputs[0].connect(xor_and2.inputs[0]);
	xor_and1.outputs[0].connect(xor_or.inputs[0]);
	xor_and2.outputs[0].connect(xor_or.inputs[1]);
	XOR = new CCircuit('XOR', [xor_io1, xor_io2, xor_n1, xor_n2, xor_and1, xor_and2, xor_or]);

    if(XOR.flow([0,0],5)[0]!=0)throw"ERROR";
	if(XOR.flow([1,0],5)[0]!=1)throw"ERROR";
	if(XOR.flow([0,1],5)[0]!=1)throw"ERROR";
	if(XOR.flow([1,1],5)[0]!=0)throw"ERROR";
	xor = CCircuit.fromJSON(XOR.toJSON());
	if(xor.flow([0,0],5)[0]!=0)throw"ERROR";
	if(xor.flow([1,0],5)[0]!=1)throw"ERROR";
	if(xor.flow([0,1],5)[0]!=1)throw"ERROR";
	if(xor.flow([1,1],5)[0]!=0)throw"ERROR";
	console.log("Teste finalizado com sucesso")
}
test();
