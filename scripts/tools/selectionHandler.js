/**
 * @file selectionHandler.js
 * 
 * Handles the selection of components
 */

/* 
############################################# SELECTION HANDLE ##########################################
* has to add the event listener to be selectable
* element.addEventListener('pointerup', selectionHandler);
* 
* selected elements has the attribute 'selected' attached to then
* 
* events:
*   .onselected()
*   .onunselected()
#########################################################################################################
*/

const selection = []; // Array of selected elements

function initializeSelectionHandler(container) {
    /**
     * @param {HTMLElement} container
     */

    //ATTACH EVENT LISTENERS
    container.selectionRectElement = document.createElement('div');
    container.selectionRectElement.setAttribute('class', 'selectionRect')
    container.appendChild(container.selectionRectElement);

    function startSelectionRectangle(e) {
        if (e.button != 0) return;
        if (e.target == workspace) {
            console.log('here');
            container.can_start_selection = true;
            container.x1 = e.clientX;
            container.y1 = e.clientY;
        }
    }

    container.addEventListener('pointerdown', (e) => {
        if (e.target == workspace) {
            clearSelection();
        }
    });

    container.addEventListener('mousedown', startSelectionRectangle);

    window.addEventListener('mousemove', e => {
        if (container.can_start_selection) {
            if (!container.rect_selection) {
                container.rect_selection = true;
                container.selectionRectElement.style.opacity = 1;
            }
            container.x2 = e.clientX;
            container.y2 = e.clientY;
            let x1 = Math.min(container.x2, container.x1);
            let y1 = Math.min(container.y2, container.y1);
            let x2 = Math.max(container.x2, container.x1);
            let y2 = Math.max(container.y2, container.y1);
            let w = x2 - x1;
            let h = y2 - y1;
            container.selectionRectElement.style.left = x1 + 'px';
            container.selectionRectElement.style.top = y1 + 'px';
            container.selectionRectElement.style.width = w + 'px';
            container.selectionRectElement.style.height = h + 'px';
            for (let el of workspace.children) {
                if (el.component) {
                    let elRect = el.getBoundingClientRect();
                    if (elRect.x > x1 &&
                        elRect.x + elRect.width < x2 &&
                        elRect.y > y1 &&
                        elRect.y + elRect.height < y2) {
                        select(el);
                    }
                    else {
                        unselect(el);
                    }
                }
            }

        }
    })

    window.addEventListener('mouseup', e => {
        if (container.rect_selection || container.can_start_selection) {
            container.rect_selection = false;
            container.can_start_selection = false;
            container.selectionRectElement.style.opacity = 0;
        }
    })
}


function clearSelection() {
    while (selection.length > 0) {
        unselect(selection[0]);
    }
}


function removeSelection() {
    while (selection.length > 0) {
        let i = components.indexOf(selection[0].component);
        if (i >= 0) components.splice(i, 1);
        let temp = selection[0]
        unselect(temp);
        try {
            temp.component.remove();
        }
        catch (e) {
            // This is a temporary fix for removing UIComponents
            temp.remove();
        }

    }
}

function select(target) {
    if (target.hasAttribute('selectable') && !target.hasAttribute('selected')) {
        let started = startActivity('selection', remove_selection_activity, clearSelection, false);
        if (started) {
            target.setAttribute('selected', '');
            let i = selection.indexOf(target);
            if (i == -1) selection.push(target)
            target.onselected?.();
            return true;
        }
    }
    return false;
}

function unselect(target) {
    if (target.hasAttribute('selected')) {
        target.removeAttribute('selected');
        target.onunselected?.();
        let i = selection.indexOf(target);
        if (i != -1) selection.splice(i, 1);
    }
    if (selection.length == 0 && activity.activity_name) {
        endActivity('selection');
    }
}


function selectionHandler(e) {
    if (e.button != 0) return;
    if (!(e.target.distX && e.target.distY) || e.target.distX == 0 && e.target.distY == 0) {
        if (e.target.hasAttribute('selected')) {
            if (!e.shiftKey && selection.length > 1) {
                let i = 0;
                while (selection.length > 1) {
                    if (selection[i] != e.target) {
                        unselect(selection[i]);
                    }
                    else {
                        i++;
                    }
                }
            }
            else {
                unselect(e.target);
            }
        }
        else {
            if (!e.shiftKey) {
                clearSelection();
            }
            select(e.target);
        }

    }
}