class RAW extends CComponent {

    static nextPowerOf2(n) {
        if (n === 0) {
            return 1;
        }
        n--;
        n |= n >> 1;
        n |= n >> 2;
        n |= n >> 4;
        n |= n >> 8;
        n |= n >> 16;
        n |= n >> 32; // Extend to 64-bit
        return n + 1;
    }   


    constructor(addresses, bits) {
        super('RAW');
        /**
         * @param {number} addresses
         * @param {number} bits
         */
        this.bits = bits;
        this.addresses = RAW.nextPowerOf2(addresses);
        if (this.addresses < 2) {
            this.addresses = 2;
            console.log('Size too small, setting to 2');
        }
        if (this.addresses > 64) {
            this.addresses = 64;
            console.log('Size too big, setting to 64');
        }

        // Create data input nodes
        for (let i = 0; i < this.bits; i++) {
            this._createNode('x' + i, CNode.INPUT);
        }

        // Create address input nodes
        for (let i = 0; i < Math.log2(this.addresses); i++) {
            this._createNode('s' + i, CNode.INPUT);
        }

        // Control input nodes
        this._createNode('r', CNode.INPUT);
        this._createNode('w', CNode.INPUT);

        // Create output nodes
        for (let i = 0; i < this.bits; i++) {
            this._createNode('d' + i, CNode.OUTPUT);
        }   

        // Allocate memory
        this.data = new Array(this.addresses);
        for (let i = 0; i < this.addresses; i++) {
            this.data[i] = new Array(this.bits);
            for (let j = 0; j < this.bits; j++) {
                this.data[i][j] = 0;
            }
        }
    }

    update() {
        // if enb is off or r is off, do nothing, set all outputs to 0
        const w = this.inputs[this.inputs.length - 1].read();
        const r = this.inputs[this.inputs.length - 2].read();
        if (w === 1 || r === 1) {
            // Read the address
            let address = 0;
            let addresses_bits = Math.log2(this.addresses);
            for (let i = 0; i < addresses_bits; i++) {
                address += this.inputs[this.bits+i].read() << i;
            }

            if (r === 1){
                // Read the data
                for (let i = 0; i < this.bits; i++) {
                    this.outputs[i].write(this.data[address][i]);
                }
            }
            else {
                // Write the data
                for (let i = 0; i < this.bits; i++) {
                    this.outputs[i].write(0);
                }
            }

            if (w === 1){
                // Write the data
                for (let i = 0; i < this.bits; i++) {
                    this.data[address][i] = this.inputs[i].read();
                }
            }

        }
        else if (r === 0) {
            for (let i = 0; i < this.bits; i++) {
                this.outputs[i].write(0);
            }
        }

    
    }

}