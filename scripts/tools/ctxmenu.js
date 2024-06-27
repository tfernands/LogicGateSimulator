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