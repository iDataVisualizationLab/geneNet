othersource = {};
d3.csv('data/Gene_Entry.csv').then(data => {othersource=data})
d3.tsv('data/hgnc_complete_set.txt').then(data => {
    const width = 6040, height = 4180;

    const Net = drawNet('#svg_main', {width, height});
    Net.draw(data);
});


function handleData(_data) {
    debugger
    // const data = _data.filter(d=>(d['Status']==='Approved')&&((d['Previous Symbols']!=='')||(d['Synonyms']!=='') )).slice(0,300);
    // const data = _data.filter(d => d['Previous Symbols']);
    _data.forEach(d=>{
        d['Previous Symbols'] = d['prev_symbol'].split('|').join(',');
        d['Synonyms'] = d['alias_symbol'].split('|').join(',');
        d['Approved Symbol'] = d['symbol'];
        return d;
    });
    // const data = _data.filter(d => d['HGNC ID']==='HGNC:11025');
    const data = _data.filter(d => d['Previous Symbols']).slice(921, 921+_data.length/50);

    const nodesObject = {};
    const linksObject = {};
    let nodes = [];
    let links = [];

    data.forEach(d => {
        const _id = d['Approved Symbol'];
        if (!nodesObject[_id]) {
            const node = {id: _id, data: [d], relatedLink:[],relatedNode:[]};
            nodesObject[_id] = node;
            nodes.push(node)
        } else {
            nodesObject[_id].data = d;
            if (!nodesObject[_id].color)
                nodesObject[_id].color = 'green';
        }

        d['Previous Symbols'] = d['Previous Symbols'].split(',');
        d['Previous Symbols'].forEach(id => {
            id = id.trim();
            if (id !== '') {
                if (!linksObject[_id+'|'+id] || !linksObject[id+'|'+_id]) {
                    const row = _data.find(f => f['Approved Symbol'] === id);
                    if (!nodesObject[id]) {
                        const node = {id, data: row, color: 'red', relatedLink: [], relatedNode: []};
                        nodesObject[id] = node;
                        nodes.push(node)
                    } else {
                        nodesObject[id].data = d;
                        if (nodesObject[id].color !== 'red')
                            nodesObject[id].color = 'green';
                    }
                    const link = {source: id, target: _id, color: 'red',value:1};
                    nodesObject[id].relatedNode.push(nodesObject[_id]);
                    nodesObject[id].relatedLink.push(link);
                    nodesObject[_id].relatedNode.push(nodesObject[id]);
                    nodesObject[_id].relatedLink.push(link);
                    linksObject[id+'|'+_id] = link;
                    links.push(link);
                }else{
                    if (linksObject[_id+'|'+id])
                        linksObject[_id+'|'+id].twoside = true;
                    else
                        linksObject[id+'|'+_id].value ++;
                }
            }
        });

        d['Synonyms'] = d['Synonyms'].split(',');
        d['Synonyms'].forEach(id => {
            id = id.trim();
            if (id !== '') {
                if (!linksObject[_id+'|'+id] || !linksObject[id+'|'+_id]) {
                const row = _data.find(f => f['Approved Symbol'] === id);
                if (!nodesObject[id]) {
                    const node = {id, data: row, color: 'blue', relatedLink:[],relatedNode:[]};
                    nodesObject[id] = node;
                    nodes.push(node)
                } else {
                    nodesObject[id].data = d;
                    if (nodesObject[id].color!=='blue')
                        nodesObject[id].color = 'green';
                }
                const link = {source: id, target: _id, color: 'blue'};
                nodesObject[id].relatedNode.push(nodesObject[_id]);
                nodesObject[id].relatedLink.push(link);
                nodesObject[_id].relatedNode.push(nodesObject[id]);
                nodesObject[_id].relatedLink.push(link);
                    linksObject[id+'|'+_id] = link;
                links.push(link);
                }else{
                    if (linksObject[_id+'|'+id])
                        linksObject[_id+'|'+id].twoside = true;
                    else
                        linksObject[id+'|'+_id].value ++;
                }
            }
        });

    });

    nodes.forEach(n=>{
        if (n.relatedLink.length===1 && (!n.relatedLink[0].twoside)){
            if (n.relatedNode[0].color==='red'){
                if (n.relatedNode[0].relatedLink.length===1){
                    n.delete = true;
                    n.relatedNode[0].delete = true;
                    n.relatedLink[0].delete = true;
                }
            }
        }
    });
    nodes = nodes.filter(n=>!n.delete);
    links = links.filter(n=>!n.delete);

    return {nodes, links};
}

function drawNet(divID, {width, height}) {
    let force = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(10).strength(1))
        .force("charge", d3.forceManyBody().strength(-3))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on('tick', ticked);
    let node, link;
    // const color = d3.scaleOrdinal(graph.keys, d3.schemeCategory10).unknown("#ccc")
    const markerBoxWidth = 5, markerBoxHeight = 5,refX = markerBoxWidth / 2,refY = markerBoxHeight / 2,markerWidth = markerBoxWidth / 2,markerHeight = markerBoxHeight / 2,
        arrowPoints = [[0, 0], [0, markerBoxHeight], [markerBoxWidth, markerHeight]];
    const svg = d3.select(divID)
        .attr("viewBox", [0, 0, width, height]);
    // .attr("width", width)
    // .attr("height", height);
    svg.append('defs')
        .selectAll('marker')
        .data(['red','green','black'])
        .enter().append('marker')
        .attr('id',d=> 'arrow'+d)
        .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
        .attr('refX', refX)
        .attr('refY', refY)
        .attr('markerWidth', markerBoxWidth)
        .attr('markerHeight', markerBoxHeight)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', d3.line()(arrowPoints))
        .attr('stroke', d=>d);

    const linksPath = svg.append("g")
        .attr("class", "links")
        .attr("stroke", "black")
        .attr("fill", "none");

    const nodesEl = svg.append("g")
        .attr('class', 'nodesEl')
        .attr("fill", "black");

    const master = {};
    master.draw = (data) => {

        let {nodes, links} = handleData(data);
        d3.select('#numNode').text(nodes.length)
        d3.select('#numLink').text(links.length)
        force.nodes(nodes);
        force.force("link").links(links);

        node = nodesEl
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr('fill', d => d.color ?? 'black')
            .attr('r', 3);
        node.selectAll('title')
            .data(d => [d])
            .join('title')
            .text(d => d.id);
        debugger
        link = linksPath
            .selectAll("line")
            .data(links)
            .join("line")
            .attr('marker-start',d=> d.twoside?'url(#arrowgreen)':null)
            .attr('marker-end', d=>d.twoside?'url(#arrowgreen)':`url(#arrow${(d.color ?? 'black')})`)
            .attr('stroke', d => d.twoside?'green':(d.color ?? 'black'));
    };

    function ticked() {
        requestAnimationFrame(() => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        })
    }

    return master;
}
