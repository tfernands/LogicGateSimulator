// Define the global variables and functions used in the project
let viewport = null; // The viewport element (Canvas)
let workspace = null; // The workspace element (Div)
let activity = null;
let components = null; // List of components in the workspace

function getWorkspaceScale(){
  let transform = workspace.computedStyleMap().get('transform')[0];
  return transform?.x.value??1;
}

/*
* pos: [clientX, clientY]
* options: [{icon:, text:, color:, callback:}, ...]
*/
function initialize(){
  components = [];
  container = document.getElementById('container');
  viewport = document.getElementById('viewport');
  workspace = document.getElementById('workspace');
  activity = document.getElementById('activity');
  let r=workspace.parentElement.getBoundingClientRect();
  viewport.scroll(Math.max(r.width,r.height), Math.max(r.width,r.height));
  
  initializeSelectionHandler(container);

  let drawer = document.getElementById('drawer');
  for (let e of drawer.children) e.remove();

  createModule("IO");
  createModule("NOT");
  createModule("AND");
  createModule("Display8Segments");

  // Define update loop
  setInterval(updateComponents, 10);
}


function updateComponents() {
  for (let j = 0; j < 5; j++){
    for (let i = 0; i < components.length; i++){
      components[i].update();
    }
  }
}


// Save and Load functions
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
  // Initialize the workspace from a JSON object
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
function createModule(module_name, module_json){
  // Create a new module (AKA new component in the drawer)
  // If module_name is not defined, it will create a new module from the workspace
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

  // Check if the module already exists
  let btn = null;
  for (let current of drawer.children){
    if (current.innerHTML == module_name){
      btn = current;
      break;
    }
  }

  // If the module does not exist, create a new one
  if (!btn){
    btn = document.createElement('button');
    btn.setAttribute('id','d'+drawer.children.length);
    btn.setAttribute('draggable','true');
    btn.innerHTML = name;
    btn.onclick = ()=>{addComponent(btn.innerHTML)};
    btn.ondragstart = dragStart;
    btn.ondragover= allowDrop;

    // Right click to remove the module from the drawer
    // and add the schematic to the workspace
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
  // Create a new module from the workspace
  if (name == undefined || name.length == 0){
    console.log('Invalid name');
    return false;
  }
  if (components.length < 2){
    console.log('Cannot create a module with less than 2 components');
    return false;
  } 
  // Sort IOs by its y position
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
  // Remove all components from the workspace
  for (let c of components) c.remove();
  components.length = 0;
}

// COMPONENTS
const componentStore = {
  'IO': () => new IO(),
  'NOT': () => new NOT(),
  'AND': () => new AND(),
}

const representationStore = {
  'IO': () => new GComponent(componentStore['IO']()),
  'NOT': () => new GComponent(componentStore['NOT']()),
  'AND': () => new GComponent(componentStore['AND']()),
  'Display8Segments': () => new GDisplay8Segments(),
}

function addComponent(json){
  // Add a component to the workspace from a JSON object

  let component = null;
  if (typeof json === 'string'){
    if (representationStore[json] == undefined){
      component = new GComponent(CCircuit.fromJSON(json));
    }
    else{
      component = representationStore[json]();
    }
  }
  else{
    component = new GComponent(CCircuit.fromJSON(json));
  }
  
  components.push(component);
  workspace.appendChild(component.render());
  let offsetRect = workspace.getBoundingClientRect();
  let contentRect = workspace.parentElement.getBoundingClientRect();
  let rect = component.element.getBoundingClientRect();
  let scale = getWorkspaceScale();
  // Center the component in the workspace
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
  // Drop a component in the workspace (used in index.html)
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