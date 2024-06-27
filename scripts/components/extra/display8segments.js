
class Display8Segments extends CComponent{
	constructor(){
		super('Display8Segments');
		this._createNode('A', CNode.INPUT);
        this._createNode('B', CNode.INPUT);
        this._createNode('C', CNode.INPUT);
        this._createNode('D', CNode.INPUT);
        this._createNode('E', CNode.INPUT);
        this._createNode('F', CNode.INPUT);
        this._createNode('G', CNode.INPUT);
        this._createNode('DP', CNode.INPUT);
	}
	update(){}
}

class Display8SegmentsDecoder extends CComponent{
	constructor(){
		super('Display8Decoder');
		this._createNode('e0', CNode.INPUT);
        this._createNode('e1', CNode.INPUT);
        this._createNode('e2', CNode.INPUT);
        this._createNode('e3', CNode.INPUT);
        this._createNode('A', CNode.OUTPUT);
        this._createNode('B', CNode.OUTPUT);
        this._createNode('C', CNode.OUTPUT);
        this._createNode('D', CNode.OUTPUT);
        this._createNode('E', CNode.OUTPUT);
        this._createNode('F', CNode.OUTPUT);
        this._createNode('G', CNode.OUTPUT);
	}
	update(){}
}


class GDisplay8Segments extends UIComponent {

    constructor() {
        super('Display8Segments');
        this.ccomp = new Display8Segments();
        this.inputs = [];
        this.state = {
            'A': 0,
            'B': 0,
            'C': 0,
            'D': 0,
            'E': 0,
            'F': 0,
            'G': 0,
            'DP': 0
        }
    }

    update() {
        this.ccomp.update();

        // Read the inputs and check if they have changed
        const svg = this.element.querySelector('svg');
        for (let i = 0; i < this.ccomp.inputs.length; i++) {
            const nid = this.ccomp.inputs[i].id;
            const nval = this.ccomp.inputs[i].read();
            if (nval != this.state[nid]) {
                this.state[nid] = nval;
                if (nval) {
                    svg.querySelector('#' + nid).classList.add('on');
                }
                else {
                    svg.querySelector('#' + nid).classList.remove('on');
                }
            }
        }
    }

    _updatePathPositions() {
        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i]._updatePathPositions();
        }
    }

    render() {
        /**
         * Create the HTML element for the component and return it
         * The element should be created only once and stored in this.element
         * @return {HTMLElement}
         */
        if (this.element) return this.element;

        this.element = document.createElement('div');
        this.element.setAttribute('id', this.id);
        this.element.setAttribute('class', 'component draggable');

        // Set the component "Selectable"
        this.element.setAttribute('selectable', '')
        this.element.addEventListener('pointerup', selectionHandler);

        // Create the input io array
        const ioarr_in = document.createElement('div');
        ioarr_in.setAttribute('class', 'ioarray in');
        this.element.appendChild(ioarr_in);

        // Set inputs
        for (let i = 0; i < this.ccomp.inputs.length; i++) {
            const node = new GNode(this.ccomp.inputs[i]);
            this.inputs.push(node);
            ioarr_in.appendChild(node.element);
        }

        // Add the event listeners
        this.element.onmove = () => { this._updatePathPositions() }

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '120');
        svg.setAttribute('height', '210');
        svg.setAttribute('viewBox', '0 0 120 210');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.innerHTML = `
            <!-- Horizontal segments -->
            <!-- Top -->
            <rect id="A" class="segment" x="20" y="10" width="80" height="20" />
            <!-- Middle -->
            <rect id="G" class="segment" x="20" y="95" width="80" height="20" />
            <!-- Bottom -->
            <rect id="D" class="segment" x="20" y="180" width="80" height="20" />

            <!-- Vertical segments -->
            <!-- Top left -->
            <rect id="F" class="segment" x="10" y="20" width="20" height="80" />
            <!-- Top right -->
            <rect id="B" class="segment" x="90" y="20" width="20" height="80" />
            <!-- Bottom left -->
            <rect id="E" class="segment" x="10" y="105" width="20" height="80" />
            <!-- Bottom right -->
            <rect id="C" class="segment" x="90" y="105" width="20" height="80" />

            <!-- Decimal point -->
            <circle id="DP" class="segment" cx="110" cy="195" r="10" />
        `;
        // Scale the SVG down
        svg.style.width = '70px';
        svg.style.height = '140px';
        // Append the SVG to the element
        svg.style.display = 'inline';

        this.element.appendChild(svg);
        return this.element;
    }

}