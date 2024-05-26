// Events ["connected", "disconnected", "statechange"]

class CNode {

	static INPUT = 0;
	static OUTPUT = 1;

	constructor(id, type, component){
		if (type != CNode.INPUT && type != CNode.OUTPUT)
			throw "Node type must be CNode.INPUT or CNode.OUTPUT";
		this.id = id;
		this.type = type;
		this.connections = [];
		this._events = {};
		this._eval = 0;
		this._state = 0;
		this._component = component;
	}

	hasConnection(){
		return this.connections.length > 0;
	}

	connect(node){
		if (node instanceof CNode){
			if (this.type == CNode.OUTPUT && node.type == CNode.INPUT){
				if (this.connections.indexOf(node) == -1 && node.connections.indexOf(this) == -1){
					node.disconnect();
					this.connections.push(node);
					node.connections.push(this);
					node._checkInputChange();
					this._dispatchEvent('connected');
					node._dispatchEvent('connected');
					return true;
				}
				else{
					console.log("Node aready connected to one of the ends");
					return false;
				}
			}
			else if (this.type == CNode.INPUT && node.type == CNode.OUTPUT){
				return node.connect(this);
			}
			else{
				console.log("Can not create connections between nodes of the same type");
				return false;
			}
		}	
		console.log("TypeError 'node' are not a CNode");
		return false;
	}

	disconnect(node){
		if (!node){
			return this.disconnectAll();
		}
		if (this.type == CNode.OUTPUT && node.type == CNode.INPUT){
			let i = this.connections.indexOf(node);
			let j = node.connections.indexOf(this);
			if (i!=-1 && j!=-1){
				this.connections.splice(i,1);
				node.connections.splice(j,1);
				node._checkInputChange();
				this._dispatchEvent('disconnected');
				node._dispatchEvent('disconnected');
				return true;
			}
		}
		else if (this.type == CNode.INPUT && node.type == CNode.OUTPUT){
			return node.disconnect(this);
		}
		return false;
	}

	disconnectAll(){
		for (let n of this.connections){
			this.disconnect(n);
		}
		this.connections.length = 0;
		return true;
	}

	set(state){
		if (state > 0) state = 1;
		else state = 0;
		if (this._state != state){
			this._state = state;
			if (this.type == CNode.OUTPUT){
				for (let n of this.connections){
					n._checkInputChange();
				}
			}
			this._dispatchEvent('statechange');
		}
	}

	write(state){
		if (state > 0) state = 1;
		else state = 0;
		if (this._state != state){
			this._state = state;
			if (this.type == CNode.OUTPUT){
				for (let n of this.connections){
					n._checkInputChange();
				}
			}
			this._dispatchEvent('statechange');
		}
	}

	read(){
		return this._state;
	}

	reset(){
		this._state = 0;
	}

	addEventListener(event_name, callback){
		if (this._events[event_name] != undefined){
			this._events[event_name].push(callback);
		}
		else{
			this._events[event_name] = [callback];
		}
	}

	toJSON(){
		return {
			id: this.id,
			type: this.type,
			_state: this._state,
			connection: this.connections.map(e=>{return e.id}),
		};
	}

	toString(){
		let strType = this.type==CNode.INPUT?"INPUT":"OUTPUT";
		return "{id:"+this.id+", type:"+strType+", _state:"+this.read()+"}"
	}

	_checkInputChange(){
		if (this.hasConnection()){
			this.write(this.connections[0].read());
		}
		else{
			this.write(0);
		}
	}

	_dispatchEvent(event_name, args){
		if (this._events[event_name] != undefined){
			for (let ev of this._events[event_name]){
				ev(args);
			}
		}
	}

}
