d3.csv('data/Gene_Entry.csv').then(data => {
    const width = 2040, height = 780;

    const Net = drawNet('#svg_main', {width, height});
    Net.draw(data);
});


function handleData(_data) {
    debugger
    // const data = _data.filter(d=>(d['Status']==='Approved')&&((d['Previous Symbols']!=='')||(d['Synonyms']!=='') )).slice(0,300);
    const data = _data.filter(d => d['Previous Symbols']);

    const nodesObject = {};
    let nodes = [];
    const links = [];

    data.forEach(d => {
        const _id = d['Approved Symbol']
        let condition = false;
        d['Previous Symbols'] = d['Previous Symbols'].split(',');
        d['Previous Symbols'].forEach(id => {
            const row = _data.find(f => f['Approved Symbol'] === id);
            if (row) {
                condition=true;
                if (!nodesObject[id]) {
                    const node = {id, data: row}
                    nodesObject[id] = node;
                    nodes.push(node)
                } else {
                    nodesObject[id].data = d;
                }
                links.push({source: id, target: _id})
            }
        });
        if (condition){
            if (!nodesObject[_id]) {
                const node = {id: _id, data: [d]};
                nodesObject[_id] = node;
                nodes.push(node)
            } else {
                nodesObject[_id].data=d;
            }
        }
    });
    debugger
    return {nodes, links};
}

function drawNet(divID, {width, height}) {
    let force = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-5))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on('tick',ticked);
    let node,link;
    // const color = d3.scaleOrdinal(graph.keys, d3.schemeCategory10).unknown("#ccc")

    const svg = d3.select(divID)
        .attr("viewBox", [0, 0, width, height]);
    // .attr("width", width)
    // .attr("height", height);

    const nodesEl = svg.append("g")
        .attr('class', 'nodesEl')
        .attr("fill", "black");

    const linksPath = svg.append("g")
        .attr("class", "links")
        .attr("stroke", "black")
        .attr("fill", "none");


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
            .attr('fill','black')
            .attr('r',3);
        node.selectAll('title')
            .data(d=>[d])
            .join('title')
            .text(d=>d.id);
        debugger
        link = linksPath
            .selectAll("line")
            .data(links)
            .join("line");
    };
    function ticked(){
        requestAnimationFrame(()=> {
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
