let current_activity = null;

function startActivity(activity_name, actions, onabort, forcestart) {
    if (!(actions instanceof Array)) {
        actions = [actions];
    }
    if (activity.activity_name && activity.activity_name != activity_name) {
        if (forcestart) {
            resetActivity();
        }
        else {
            return false;
        }
    }
    if (activity.activity_name != activity_name) {
        for (let action of actions) {
            let action_el = document.createElement('div');
            let icon_el = document.createElement('i');
            icon_el.setAttribute('class', 'material-icons');
            icon_el.innerHTML = action.icon;
            let text_el = document.createElement('span');
            text_el.innerHTML = action.text;
            action_el.appendChild(icon_el);
            action_el.appendChild(text_el);
            action_el.onclick = action.callback;
            activity.appendChild(action_el);
        }
    }
    activity.activity_name = activity_name;
    activity.onabort = onabort;
    activity.aborted = false;
    activity.style.transform = 'translateY(0)';
    activity.style.visibility = 'visible'
    activity.ontransitionend = null;
    return true;
}

function resetActivity() {
    activity.activity_name = null;
    activity.ontransitionend = null;
    activity.onabort = null;
    activity.aborted = false;
    while (activity.children.length > 0)
        activity.children[0].remove();
}

function abortActivity(activity_name) {
    if (activity_name && activity_name != activity.activity_name || activity.aborted) return;
    activity.ontransitionend = resetActivity;
    activity.style.transform = 'translateY(-5em)';
    activity.style.visibility = 'hidden';
    if (!activity.aborted) {
        activity.aborted = true;
        activity.onabort?.();
    }
    activity.onabort = null;
}

function endActivity(activity_name) {
    if (activity_name && activity_name != activity.activity_name || activity.aborted) return;
    activity.ontransitionend = resetActivity;
    activity.style.transform = 'translateY(-5em)';
    activity.style.visibility = 'hidden';
}
