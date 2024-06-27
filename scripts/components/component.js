// Basic Component class

class UIComponent {

    /**
     * @param {string} id
    */

    constructor(id) {
        this.id = id;
        this.element = null; // The HTML element
    }

    setPosition(x, y) {
        this.element.style.top = x + "px";
        this.element.style.left = y + "px";
    }

    update() {
        // Update the component
    }

    remove() {
        // Called when the component is removed, should remove all event listeners
        // and references to the component
        unselect(this.element);
        this.element.remove();
        this.onremove?.();
    }

    toJSON() {
        return {
            x: this.element.style.left,
            y: this.element.style.top,
        };
    }

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

        // Create the name element
        const name = document.createElement('p');
        name.setAttribute('unselectable', '');
        this.element.appendChild(name);
        name.innerHTML = this.id;

        // Set the component "Selectable"
        this.element.setAttribute('selectable', '')
        this.element.addEventListener('pointerup', selectionHandler);
        return this.element;
    }
}


/* 
############################################# POINTER MOVE ##########################################
* element has to contain the class draggable
#####################################################################################################
*/

document.onmousedown = dragHandler;
document.ontouchstart = dragHandler;

function dragHandler(e) {
    let target = e.target;
    if (!target.classList.contains("draggable") || e.button != 0) {
        return;
    }
    viewport.style = "overflow: hidden";
    target.moving = true;
    target.distX = 0;
    target.distY = 0;

    e.clientX ? // Check if Mouse events exist on user' device
        (target.oldX = e.clientX, // If they exist then use Mouse input
            target.oldY = e.clientY) :
        (target.oldX = e.touches[0].clientX, // otherwise use touch input
            target.oldY = e.touches[0].clientY)

    target.oldLeft = window.getComputedStyle(target).getPropertyValue('left').split('px')[0] * 1;
    target.oldTop = window.getComputedStyle(target).getPropertyValue('top').split('px')[0] * 1;
    for (let selected of selection) {
        selected.oldLeft = window.getComputedStyle(selected).getPropertyValue('left').split('px')[0] * 1;
        selected.oldTop = window.getComputedStyle(selected).getPropertyValue('top').split('px')[0] * 1;
    }

    function dr(event) {
        if (!target.moving) {
            return;
        }
        event.clientX ?
            (target.distX = event.clientX - target.oldX,
                target.distY = event.clientY - target.oldY) :
            (target.distX = event.touches[0].clientX - target.oldX,
                target.distY = event.touches[0].clientY - target.oldY)
        let s = getWorkspaceScale();
        target.distX /= s;
        target.distY /= s;

        let targetmoved = false;
        for (let selected of selection) {
            if (selected.classList.contains("draggable")) {
                selected.style.left = selected.oldLeft + target.distX + "px";
                selected.style.top = selected.oldTop + target.distY + "px";
                selected.onmove?.();
                if (selected == target) {
                    targetmoved = true;
                }
            }
        }
        if (!targetmoved) {
            target.style.left = target.oldLeft + target.distX + "px";
            target.style.top = target.oldTop + target.distY + "px";
            target.onmove?.()
        }
    }
    document.onmousemove = dr;
    document.ontouchmove = dr;

    function endDrag() {
        target.moving = false;
        viewport.style = "";
        document.onmousemove = null;
        document.ontouchmove = null;
        target.onmouseup = null;
        target.ontouchend = null;
    }
    target.onmouseup = endDrag;
    target.ontouchend = endDrag;

}


function addUIComponent(uiComponent) {
    /**
     * @param {UIComponent} uiComponent
     * @return {UIComponent}
     */

    // Add a component to the workspace from a JSON object
    components.push(uiComponent);
    workspace.appendChild(uiComponent.render());
    let offsetRect = workspace.getBoundingClientRect();
    let contentRect = workspace.parentElement.getBoundingClientRect();
    let rect = uiComponent.element.getBoundingClientRect();
    let scale = getWorkspaceScale();
    // Center the component in the workspace
    uiComponent.element.style.top = ((contentRect.height / 2 - offsetRect.y) / scale - rect.height / (2 * scale)) + 'px';
    uiComponent.element.style.left = ((contentRect.width / 2 - offsetRect.x) / scale - rect.width / (2 * scale)) + 'px';
    return uiComponent;
}
