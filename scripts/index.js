let viewport = null;
let workspace = null;
let activity = null;
let componentlist = null;
let components = []

function getWorkspaceScale(){
  let transform = workspace.computedStyleMap().get('transform')[0];
  return transform?.x.value??1;
}

/*
* pos: [clientX, clientY]
* options: [{icon:, text:, color:, callback:}, ...]
*/
function ctxmenu(e, options){
  let ctx = document.getElementById('ctxmenu');
  let ctxcontent = document.getElementById('ctxcontent');
  ctx.style.visibility='hidden';
  ctxcontent.style.transition='0s';
  ctxcontent.style.top = (e.clientY+10)+'px';
  ctxcontent.style.left = (e.clientX+10)+'px';
  while (ctxcontent.children.length > 0)
    ctxcontent.children[0].remove();
  if (options){
    for (let o of options){
      let label = document.createElement('label');
      let icon = document.createElement('i');
      icon.setAttribute('class', 'material-icons');
      icon.innerHTML = o.icon;
      label.appendChild(icon);
      label.innerHTML += o.text;
      label.onclick = o.callback;
      if (o.color){
        label.style.color=o.color;
      }
      ctxcontent.appendChild(label);
    }
    ctxcontent.style.height = 'auto';
    ctxcontent.style.height = '0px';
    ctx.style.visibility='visible';
    ctxcontent.style.transition='height .2s';
    ctxcontent.style.height = 'auto';
  }
}

function initialize(){
  components = [];
  container = document.getElementById('container');
  viewport = document.getElementById('viewport');
  workspace = document.getElementById('workspace');
  componentlist = document.getElementById('componentlist')
  activity = document.getElementById('activity');
  let r=workspace.parentElement.getBoundingClientRect();
  viewport.scroll(Math.max(r.width,r.height), Math.max(r.width,r.height));

  //ATTACH EVENT LISTENERS
  container.selectionRectElement = document.createElement('div');
  container.selectionRectElement.setAttribute('class','selectionRect')
  container.appendChild(container.selectionRectElement);

  function startSelectionRectangle(e) {
    if (e.button!=0) return;
    if (e.target == workspace){
      console.log('here');
      container.can_start_selection = true;
      container.x1 = e.clientX;
      container.y1 = e.clientY;
    }
  }

  container.addEventListener('pointerdown', (e)=>{
    if (e.target == workspace){
      clearSelection();
    }
  });
  container.addEventListener('mousedown', startSelectionRectangle);
  window.addEventListener('mousemove', e=>{
    if (container.can_start_selection){
      if (!container.rect_selection){
        container.rect_selection = true;
        container.selectionRectElement.style.opacity=1;
      }
      container.x2 = e.clientX;
      container.y2 = e.clientY;
      let x1 = Math.min(container.x2, container.x1);
      let y1 = Math.min(container.y2, container.y1);
      let x2 = Math.max(container.x2, container.x1);
      let y2 = Math.max(container.y2, container.y1);
      let w = x2-x1;
      let h = y2-y1;
      container.selectionRectElement.style.left = x1+'px';
      container.selectionRectElement.style.top = y1+'px';
      container.selectionRectElement.style.width = w+'px';
      container.selectionRectElement.style.height = h+'px';
      for (let el of workspace.children){
        if (el.component){
          let elRect = el.getBoundingClientRect();
          if (elRect.x > x1 &&
              elRect.x+elRect.width < x2 &&
              elRect.y > y1 &&
              elRect.y+elRect.height < y2){
            select(el);
          }
          else{
            unselect(el);
          }
        }
      }

    }
  })
  window.addEventListener('mouseup', e=>{
    if (container.rect_selection || container.can_start_selection){   
      container.rect_selection = false;
      container.can_start_selection = false;
      container.selectionRectElement.style.opacity=0;
    }
  })

  let drawer = document.getElementById('drawer');
  for (let e of drawer.children) e.remove();
  createModule("IO");
  createModule("NOT");
  createModule("AND");
  setInterval(updateComponents, 10);
}


function updateComponents() {
  for (let j = 0; j < 5; j++){
    for (let i = 0; i < components.length; i++){
      components[i].update();
    }
  }
}


// SAVE AND LOAD

function save(e){
  let project_name = document.getElementById('project_name').value;

  let modules = [];
  for (let btn of document.getElementById('drawer').children){
    modules.push(btn.innerHTML);
  }

  let savejson = {
    modules: modules,
    components: CCircuit.components,
    workspace: createModuleFromWorkspace(project_name),
  }

  let bb = new Blob([JSON.stringify(savejson)], { type: 'text/json' });
  var a = document.createElement('a');
  a.download = project_name+'.json';
  a.href = window.URL.createObjectURL(bb);
  a.click();
}

json = null;
function load(files) {
  var file = files[0];
  var reader = new FileReader();
  reader.onload = function(progressEvent){
    json = JSON.parse(this.result);
    CCircuit.components = json.components;
    document.getElementById('drawer').innerHTML="";
    initialize();
    for (const key of json.modules) {
      if (key) createModule(key, CCircuit.components[key]);
    }
    clearWorkspace();
    workspaceFromJSON(json.workspace);
  };
  reader.readAsText(file); 
}

function workspaceFromJSON(jsonComponent){
  document.getElementById('project_name').innerHTML = jsonComponent.name;
  let components_added = []
  for (const i in jsonComponent.components){
    let comp = addComponent(jsonComponent.components[i]);
    comp.element.style.left = jsonComponent.g[i].x;
    comp.element.style.top = jsonComponent.g[i].y;
    components_added.push(comp);
  }
  for (const i in jsonComponent.inputs){
    try {
      const c = jsonComponent.inputs[i];
      const gnode = components_added[c[0]].inputs[c[1]];
      gnode.rename(c[2]);
    }
    catch(e) { console.log(e); }
  }
  for (const i in jsonComponent.outputs){
    try {
      const c = jsonComponent.outputs[i];
      const gnode = components_added[c[0]].outputs[c[1]-components_added[c[0]].inputs.length]
      gnode.rename(c[2]);
    }
    catch(e) { console.log(e); }
  }
  for (const i in jsonComponent.connections){
    try {
      let cout = jsonComponent.connections[i][0];
      let cin = jsonComponent.connections[i][1];
      let gnode_out = components_added[cout[0]].outputs[cout[1]-components_added[cout[0]].inputs.length];
      let gnode_in = components_added[cin[0]].inputs[cin[1]];
      let con = new GConnection(gnode_out);
      con.connect(gnode_in);
    }
    catch(e) { console.log(e); }
  }
  return components_added;
}

// CREATE MODULE
function getModuleBtn(module_name){
  for (let current of drawer.children){
    if (current.innerHTML == module_name){
      return current;
    }
  }
  return null;
}
function createModule(module_name, module_json){
  let name = module_name;
  let json = module_json;
  if (name == undefined && json == undefined){
    let component_name = document.getElementById("component_name");
    name = component_name.value.toUpperCase();
    component_name.value="";
    json = createModuleFromWorkspace(name);
    CCircuit.components[json.name] = json;
    clearWorkspace();
  } 
  let drawer = document.getElementById("drawer");

  let btn = getModuleBtn(name);
  if (!btn){
    btn = document.createElement('button');
    btn.setAttribute('id','d'+drawer.children.length);
    btn.setAttribute('draggable','true');
    btn.innerHTML = name;
    btn.onclick = ()=>{addComponent(btn.innerHTML)};
    btn.ondragstart = dragStart;
    btn.ondragover= allowDrop;
    btn.oncontextmenu=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      let cx = 0;
      let cy = 0;
      let tempComp = workspaceFromJSON(CCircuit.components[btn.innerHTML]);
      let offsetRect = workspace.getBoundingClientRect();
      let viewportRect = viewport.getBoundingClientRect();
      for (let cmp of tempComp){
        let rect = cmp.element.getBoundingClientRect();
        cx += rect.x-offsetRect.x;
        cy += rect.y-offsetRect.y;
        select(cmp.element);
      }
      cx=(cx/tempComp.length)-viewportRect.width/2;
      cy=(cy/tempComp.length)-viewportRect.height/2;
      viewport.scrollTo(cx,cy);
      btn.remove();
    };
    drawer.appendChild(btn);
  }
  return true;
}

function createModuleFromWorkspace(name){
  if (name.length == 0 || components.length < 2)
    return false;
  //ORDENAR ENTRADA E SAIDAS
  components = components.sort((a, b)=>{
    if (a.element.getBoundingClientRect().y > b.element.getBoundingClientRect().y){
      return 1;
    }
    else
      return -1;
  });
  let json = (new CCircuit(name, components.map(e=>{return e.ccomp}))).toJSON();
  json.g = components.map(e=>{return e.toJSON()});
  return json;
}

function clearWorkspace(){
  for (let c of components) c.remove();
  components.length = 0;
  componentlist.innerHTML = '';
  document.getElementById('listcount').innerHTML=0;
}


function addComponent(json){
  let workspace = document.getElementById("workspace");
  let component = new GComponent(CCircuit.fromJSON(json));
  components.push(component);

  let count = document.getElementById('listcount');
  let li = document.createElement('li');
  let span = document.createElement('span');
  span.innerHTML = component.ccomp.name;
  let i = document.createElement('i');
  i.setAttribute('class', "material-icons");
  i.innerHTML='delete';
  i.onclick=()=>{component.remove()};
  component.onremove = ()=>{li.remove();count.innerHTML = components.length;};
  li.appendChild(span);
  li.appendChild(i);
  componentlist.appendChild(li);
  count.innerHTML = components.length;

  workspace.appendChild(component.element);
  let offsetRect = workspace.getBoundingClientRect();
  let contentRect = workspace.parentElement.getBoundingClientRect();
  let rect = component.element.getBoundingClientRect();
  let scale = getWorkspaceScale();
  component.element.style.top=((contentRect.height/2-offsetRect.y)/scale-rect.height/(2*scale))+'px';
  component.element.style.left=((contentRect.width/2-offsetRect.x)/scale-rect.width/(2*scale))+'px';
  return component;
}


// KEY EVENTS HANDLE

addEventListener("keydown", (e)=>{
  if (e.key=='Delete'){
    removeSelection();
  }
  if (e.key=='Escape'){
    abortActivity();
    document.getElementById('dialog-nc').close();
    document.getElementById('dialog-ioname').close(); 
  }
});

function openContextMenu(names, callbacks){
  let content = document.getElementById("ctx-01");
  content.innerHTML ="";
  for (let i in names){
    let option = document.createElement('button');
    option.onclick = callbacks[i];
  }
}

function dragStart(event) {
  event.dataTransfer.setData("Text", event.target.id);
  //event.target.style.visibility='hidden';
}

function onDrop(event) {
  event.preventDefault();
}

function allowDrop(event) {
  event.preventDefault();
}

function drawer_drop(event) {
  event.preventDefault();
  let data = event.dataTransfer.getData("Text");
  let dragged = document.getElementById(data);
  event.target.parentElement.insertBefore(dragged,event.target);
}

function workspace_drop(e){
  e.preventDefault();
  let data = e.dataTransfer.getData("Text");
  let dragged = document.getElementById(data);
  let component = addComponent(dragged.innerHTML);
  let offsetRect = component.element.parentElement.getBoundingClientRect();
  let rect = component.element.getBoundingClientRect();
  let scale = getWorkspaceScale();
  component.element.style.top=((e.clientY-offsetRect.y)/scale-rect.height/(2*scale))+'px';
  component.element.style.left=((e.clientX-offsetRect.x)/scale-rect.width/(2*scale))+'px';
}





let current_activity = null;
function startActivity(activity_name, actions, onabort, forcestart){
  if (!(actions instanceof Array)){
    actions = [actions];
  }
  if (activity.activity_name && activity.activity_name != activity_name){
    if (forcestart){
      resetActivity();
    }
    else{
      return false;
    }
  }
  if (activity.activity_name != activity_name){
    for (let action of actions){
      let action_el = document.createElement('div');
      let icon_el = document.createElement('i');
      icon_el.setAttribute('class', 'material-icons');
      icon_el.innerHTML = action.icon;
      let text_el = document.createElement('span');
      text_el.innerHTML = action.text;
      action_el.appendChild(icon_el);
      action_el.appendChild(text_el);
      action_el.onclick=action.callback;
      activity.appendChild(action_el);
    }
  }
  activity.activity_name = activity_name;
  activity.onabort = onabort;
  activity.aborted = false;
  activity.style.transform='translateY(0)';
  activity.style.visibility='visible'
  activity.ontransitionend=null;
  return true;
}

function resetActivity(){
  activity.activity_name = null;
  activity.ontransitionend = null;
  activity.onabort = null;
  activity.aborted = false;
  while (activity.children.length > 0)
    activity.children[0].remove();
}

function abortActivity(activity_name) {   
  if (activity_name && activity_name!=activity.activity_name || activity.aborted) return;
  activity.ontransitionend=resetActivity;
  activity.style.transform='translateY(-5em)';
  activity.style.visibility='hidden';
  if (!activity.aborted){
    activity.aborted = true;
    activity.onabort?.();
  }
  activity.onabort = null;
}

function endActivity(activity_name){
  if (activity_name && activity_name!=activity.activity_name || activity.aborted) return;
  activity.ontransitionend=resetActivity;
  activity.style.transform='translateY(-5em)';
  activity.style.visibility='hidden';
}
