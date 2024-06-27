let offsetX, offsetY;

class GNode {

    constructor(cnode) {
        this.cnode = cnode;
        this.element = document.createElement('div');
        this.element.setAttribute('class', 'io tooltip');
        this.element.setAttribute('type', cnode.type);
        this.element.setAttribute('id', cnode.id);
        this.element.setAttribute('state', cnode.read());

        this.tooltip = document.createElement('p');
        this.element.appendChild(this.tooltip);
        this.tooltip.setAttribute('class', 'tooltiptext ' + (cnode.type == CNode.INPUT ? 'tooltip-right' : 'tooltip-left'));
        this.tooltip.innerHTML = this.cnode.id;


        let gnode = this;
        this.element.addEventListener('contextmenu', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();

            let pop = document.getElementById('dialog-ioname');
            let form = pop.querySelector('form');
            let input = document.getElementById('io_name');
            input.value = cnode.id;
            form.onsubmit = event => {
                event.preventDefault();
                gnode.rename(input.value);
                document.getElementById('dialog-ioname').close();
                return false;
            };
            ctxmenu(ev,
                [
                    { icon: 'edit', text: 'Renomear porta', callback: () => { pop.showModal() } },
                    { icon: 'link_off', text: 'Desconnectar', callback: () => { cnode.disconnectAll() }, color: 'red' },
                ]
            );
            return false;
        }, false);


        this.cnode.gnode = this;
        this.paths = []

        this.cnode.addEventListener('statechange', () => {
            this.element.setAttribute('state', this.cnode.read());
            for (let p of this.paths) {
                p.updateState();
            }
        });

        if (this.cnode.type == CNode.INPUT) {
            this.element.style.cursor = 'pointer';
            this.element.addEventListener('pointerdown', (e) => {
                if (e.button != 0) return;
                if (e.target == this.element && !this.cnode.hasConnection() && !GConnection.connection_creation_mode) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.changeState();
                    updateComponents();
                }
            });
            this.element.addEventListener('pointerover', (e) => {
                if (GConnection.connection_creation_mode) {
                    GConnection.tempConnection.gnode2 = this;
                }
            });
            this.element.addEventListener('pointerout', (e) => {
                if (GConnection.connection_creation_mode) {
                    GConnection.tempConnection.gnode2 = null;
                }
            });
        }
        if (this.cnode.type == CNode.OUTPUT) {
            this.element.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.button != 0) return;
                GConnection.createConnectionBegin(this);
            });
        }
    }

    rename(name) {
        this.cnode.id = name;
        this.tooltip.innerHTML = name;
    }

    read() {
        return this.cnode.read();
    }

    changeState() {
        if (this.cnode.read() == 1) this.cnode.write(0);
        else this.cnode.write(1);
    }

    getPosition() {
        let pr = workspace.getBoundingClientRect();
        let r = this.element.getBoundingClientRect();
        let s = getWorkspaceScale();
        return {
            x: (r.x - pr.x + r.width / 2) / s,
            y: (r.y - pr.y + r.height / 2) / s,
        };
    }

    disconnectAll() {
        this.cnode.disconnectAll();
        while (this.paths.length > 0)
            this.paths[0].remove();
        this.paths.length = 0;
    }

    remove() {
        this.disconnectAll();
        this.element.remove();
    }

    _updatePathPositions() {
        for (let p of this.paths) {
            p.updatePosition();
        }
    }
}


class GConnection {

    static connection_creation_mode = false;
    static tempConnection = null;

    static createConnectionBegin(gnode) {
        let actions = {
            icon: 'close',
            text: 'Criando conexão...',
            callback: GConnection.createConnectionAbort,
        }
        if (GConnection.connection_creation_mode ||
            !startActivity('conexao', actions, GConnection.createConnectionAbort, true))
            return;

        GConnection.connection_creation_mode = true;
        GConnection.tempConnection = new GConnection(gnode, null);

        document.onpointermove = (e) => {
            e = e || window.event;
            e.preventDefault();
            GConnection.tempConnection.updatePosition();
            let d = GConnection.tempConnection.element.getAttribute('d');
            let pr = workspace.getBoundingClientRect();
            let s = getWorkspaceScale();
            let x = (e.clientX - pr.x) / s;
            let y = (e.clientY - pr.y) / s;
            GConnection.tempConnection.element.setAttribute('d', d + ' L ' + x + ' ' + y);
            GConnection.tempConnection.element.setAttribute('state', gnode.read());
        }

        document.onpointerup = (e) => {
            if (GConnection.tempConnection.gnode2 != null) {
                GConnection.tempConnection.connect(GConnection.tempConnection.gnode2);
            }
            else {
                let pr = workspace.getBoundingClientRect();
                let x = e.clientX - pr.x;
                let y = e.clientY - pr.y;
                GConnection.tempConnection.addPoint(x, y);
            }
        }
    }

    static createConnectionAbort() {
        GConnection.connection_creation_mode = false;
        GConnection.tempConnection.disconnect();
        document.onpointerup = null;
        document.onpointermove = null;
        abortActivity();
    }

    static createConnectionEnd() {
        if (GConnection.tempConnection && GConnection.tempConnection.gnode2 == null) {
            return GConnection.createConnectionAbort();
        }
        GConnection.connection_creation_mode = false;
        document.onpointerup = null;
        document.onpointermove = null;
        endActivity();
    }

    constructor(gnode1) {
        this.points = [];
        this.gnode1 = gnode1;
        this.gnode2 = null;
        this.svg = document.getElementById("svg");
        this.element = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        this.element.setAttribute('class', 'connection')
        this.element_touch = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        this.element_touch.setAttribute('class', 'connection_touch')
        this.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        this.circle.setAttribute('class', 'virtual');
        this.svg.appendChild(this.element);
        this.svg.appendChild(this.element_touch);
        this.svg.appendChild(this.circle);
        this.element.setAttribute('state', gnode1.read());
        this.element.setAttribute('selectable', '');
        this.element_touch.component = this;
        this.element_touch.setAttribute('selectable', '');
        this.element_touch.addEventListener('pointerup', selectionHandler);
        this.element_touch.onpointermove = (e) => {
            let r = workspace.getBoundingClientRect();
            let s = getWorkspaceScale();
            let point = this._closestPoint(this.element, [(e.clientX - r.x) / s, (e.clientY - r.y) / s])
            this.circle.style.visibility = 'visible';
            this.circle.setAttribute('cx', point[0]);
            this.circle.setAttribute('cy', point[1]);
        };
        this.element_touch.onpointerleave = (e) => {
            this.circle.style.visibility = 'hidden';
        }
        this.element_touch.onselected = () => {
            this.element.setAttribute('selected', '');
            if (!GConnection.connection_creation_mode) {
                for (let p of this.points) {
                    p[2].setAttribute('selected', '');
                }
            }
        }
        this.element_touch.onunselected = () => {
            this.element.removeAttribute('selected');
            for (let p of this.points) {
                p[2].removeAttribute('selected');
            }
        }
    }

    addPoint(x, y) {
        // let circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        // circle.setAttribute('cx', x);
        // circle.setAttribute('cy', y);
        // circle.setAttribute('i', this.points.length);
        // circle.setAttribute('class','draggable');
        // circle.setAttribute('state',  this.gnode1.read());
        // circle.onmove = (e)=>{
        //   circle.setAttribute('cx', circle.style.left);
        //   circle.setAttribute('cy', circle.style.top);
        //   let i = circle.getAttribute('i');
        //   let r = circle.getBoundingClientRect();
        //   let or = workspace.getBoundingClientRect();
        //   this.points[i][0] = r.x-or.x+r.width/2;
        //   this.points[i][1] = r.y-or.y+r.height/2;
        //   this.updatePosition();
        // };
        // this.svg.appendChild(circle);
        // this.points.push([x, y, circle]);
    }

    connect(gnode2) {
        this.gnode2 = gnode2;
        if (!this.gnode2) {
            return false;
        }
        if (this.gnode1.cnode.connect(this.gnode2.cnode)) {
            this.updatePosition();
            this.gnode1.paths.push(this);
            this.gnode2.paths.push(this);
            this.gnode2.cnode.addEventListener('disconnected', () => { this.disconnect() })
            GConnection.createConnectionEnd();
            return true;
        }
        GConnection.createConnectionAbort();
        return false;
    }

    disconnect() {
        this.remove();
    }

    remove() {
        let i = this.gnode1.paths.indexOf(this);
        this.gnode1.paths.splice(i, 1);
        if (this.gnode2 != null) {
            i = this.gnode2.paths.indexOf(this);
            this.gnode2.paths.splice(i, 1);
            this.gnode1.cnode.disconnect(this.gnode2.cnode)
        }
        this.element.remove();
        this.element_touch.remove();
        this.circle.remove();
        for (let p of this.points) {
            p[2].remove();
        }
        this.points.length = 0;
    }

    updateState() {
        let state = this.gnode1.read();
        this.element.setAttribute('state', state);
        for (let p of this.points) {
            p[2].setAttribute('state', state);
        }
    }

    updatePosition() {
        let p1 = this.gnode1.getPosition();
        let d = 'M ' + p1.x + ' ' + p1.y;
        for (let p of this.points) {
            d += ' L ' + (p[0]) +
                ' ' + (p[1]);
        }
        if (this.gnode2) {
            let p2 = this.gnode2.getPosition();
            d += ' L ' + p2.x + ' ' + p2.y;
        }
        this.element.setAttribute('d', d);
        this.element_touch.setAttribute('d', d);
    }

    _closestPoint(pathNode, point) {
        function distance2(p) {
            var dx = p.x - point[0],
                dy = p.y - point[1];
            return dx * dx + dy * dy;
        }
        var pathLength = pathNode.getTotalLength();
        // var pathLength = 2.0 * Math.PI * 100;
        var precision = 8;
        var best;
        var bestLength;
        var bestDistance = Infinity;

        // linear scan for coarse approximation
        for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
            if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
                best = scan, bestLength = scanLength, bestDistance = scanDistance;
            }
        }
        // binary search for precise estimate
        precision /= 2;
        while (precision > 0.5) {
            var before,
                after,
                beforeLength,
                afterLength,
                beforeDistance,
                afterDistance;
            if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
                best = before, bestLength = beforeLength, bestDistance = beforeDistance;
            } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
                best = after, bestLength = afterLength, bestDistance = afterDistance;
            } else {
                precision /= 2;
            }
        }

        best = [best.x, best.y];
        best.distance = Math.sqrt(bestDistance);
        return best;
    }


}

class GComponent extends UIComponent {

    constructor(ccomp) {
        super(ccomp.name);
        this.ccomp = ccomp;
        this.inputs = [];
        this.outputs = [];
    }

    // Overwrite
    update() {
        this.ccomp.update();
    }

    // Overwrite
    remove() {
        super.remove();
        for (let n of this.inputs) n.remove();
        for (let n of this.outputs) n.remove();
    }

    getNodeById(node_id) {
        return this.ccomp.getNodes().find(n => (n.id == node_id));
    }

    writeNodeStatesByIdList(nodelist, states) {
        for (const i in nodelist) {
            try {
                this.getNodeById(nodelist[i]).set(states[i]);
            }
            catch (e) {
                console.log(e);
                console.log(i, nodelist, nodelist[i]);
            }
        }
    }

    readNodeStatesByIdList(nodelist) {
        return nodelist.map(n => this.getNodeById(n).read());
    }

    _updatePathPositions() {
        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i]._updatePathPositions();
        }
        for (let i = 0; i < this.outputs.length; i++) {
            this.outputs[i]._updatePathPositions();
        }
    }

    // Overwrite
    render() {
        /**
         * Create the HTML element for the component and return it
         * The element should be created only once and stored in this.element
         * @return {HTMLElement}
         */
        if (this.element) return this.element;

        this.element = document.createElement('div');
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

        // Create the name element
        const name = document.createElement('p');
        name.setAttribute('unselectable', '');
        this.element.appendChild(name);
        name.innerHTML = this.ccomp.name;

        // Create the output io array
        const ioarr_out = document.createElement('div');
        ioarr_out.setAttribute('class', 'ioarray out');
        this.element.appendChild(ioarr_out);

        // Set inputs and outputs
        for (let i = 0; i < this.ccomp.inputs.length; i++) {
            const node = new GNode(this.ccomp.inputs[i]);
            this.inputs.push(node);
            ioarr_in.appendChild(node.element);
        }
        for (let i = 0; i < this.ccomp.outputs.length; i++) {
            const node = new GNode(this.ccomp.outputs[i]);
            this.outputs.push(node);
            ioarr_out.appendChild(node.element);
        }

        // Add a reference to the component in the HTML element
        this.element.component = this;

        // Add the event listeners
        this.element.onmove = () => { this._updatePathPositions() }
        this.element.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            e.stopPropagation();
            let selected = this.hasAttribute('selected');
            ctxmenu(e, [
                { icon: selected ? 'radio_button_unchecked' : 'check_circle', text: selected ? 'Remover seleção' : 'Selecionar', callback: selected ? () => { unselect(this) } : () => { select(this) } },
                { icon: 'delete', text: 'Deletar', color: 'red', callback: () => { this.component.remove() } },
            ]);
            return false;
        }, false);

        return this.element;
    }
}


let remove_selection_activity = {
    icon: 'delete',
    text: 'Excluir iten(s) selecionados',
    callback: removeSelection,
}