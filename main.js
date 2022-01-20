let presetCoord = {
    Tokyo: [35.7323, 139.7047],
    Kyoto: [34.7571, 135.7885],
    Shizuoka: [34.9866, 138.3971],
    Hyougo: [34.8802, 134.5922],
    TMU: [35.6609, 139.3662]
}

function choice(array) {
    return array[Math.floor(Math.random() * array.length)]
}

const map = L.map("map", {
    minZoom: 5,
    maxZoom: 16,
    zoom: 16,
    center: presetCoord[choice(["Shizuoka", "Hyougo", "TMU"])],
    preferCanvas: true,
    layers: new L.StamenTileLayer("toner", {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
    })
})

L.hash(map)

const miniMap = L.map("mini-map", {
    minZoom: 3,
    maxZoom: 16,
    zoom: 5,
    center: map.options.center,
    preferCanvas: true,
    layers: L.tileLayer('https://maps.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
        attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
    })
}).on('click', e => {
    console.log("clicked", e.latlng)
    map.setView(e.latlng, 16)
    document.form.radios.forEach(rad => {
        rad.checked = false
    })
})

document.form.radios.forEach(rad => {
    rad.addEventListener('change', function () {
        console.log("selected", this.id)
        map.setView(presetCoord[this.id], 16)
        miniMap.setView(presetCoord[this.id], 5)
    })
})

const style = {
    default: {
        color: "coral",
        weight: 5,
        opacity: 0.5
    },
    clicked: {
        color: "blue",
        weight: 6,
        opacity: 1
    },
    path: {
        color: "purple",
        weight: 5,
        opacity: 0.1
    },
    black: {
        color: "black",
        radius: 2,
        opacity: 1
    },
    red: {
        color: "red",
        radius: 2,
        opacity: 1
    },
    yellow: {
        color: "yellow",
        radius: 2,
        opacity: 1
    },
    green: {
        color: "green",
        radius: 2,
        opacity: 1
    }
}

function dist(seq) {
    let d = 0
    for (let i = 0; i + 1 < seq.length; i++) {
        const dx = seq[i][0] - seq[i + 1][0]
        const dy = seq[i][1] - seq[i + 1][1]
        d += Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
    }
    return d
}

const lineMap = {}
Object.assign(new L.GridLayer({
    attribution: "<a href='https://github.com/gsi-cyberjapan/experimental_rdcl' target='_blank'>国土地理院ベクトルタイル提供実験</a>",
}), {
    createTile: function(coords) {
        const template = "https://cyberjapandata.gsi.go.jp/xyz/experimental_rdcl/{z}/{x}/{y}.geojson"
        const div = document.createElement('div')
        fetch(L.Util.template(template, coords)).then(response => {
            if (!response.ok) {
                throw new Error(response.status, response.statusText)
            }
            // console.log("fetched", response.url)
            return response.json()
        }).then(json => {
            const road = json.features
            if (!road) return
            div.group = L.layerGroup()
            leaves = {}
            road.forEach((geojson) => {
                const poly = geojson.geometry.coordinates.map(a => [a[1], a[0]])
                const polyLine = L.polyline(poly, style.default)
                div.group.addLayer(polyLine)
                map.almostOver.addLayer(polyLine)
                leaves[polyLine._leaflet_id] = {
                    "src": poly[0].toString(),
                    "dst": poly[poly.length - 1].toString(),
                    "dist": dist(poly),
                    "poly": poly
                }
            })
            div.group.addTo(this._map)
            lineMap[div.group._leaflet_id] = leaves
            const num = Object.keys(lineMap).length
            console.log("added", div.group._leaflet_id, `(${num})`)
        }).catch(console.error)
        return div
    }
}).on("tileunload", function(e) {
    if (e.tile.group) {
        const num = Object.keys(lineMap).length
        console.log("removed", e.tile.group._leaflet_id, `(${num})`)
        this._map.removeLayer(e.tile.group)
        delete lineMap[e.tile.group._leaflet_id]
        delete e.tile.group
    }
}).addTo(map)

const choicesEachTile = () => {
    return Object.keys(lineMap).map(key => {
        const array = Object.keys(lineMap[key])
        const edgeKey = choice(array)
        return lineMap[key][edgeKey].src
    })
}

let shortestPaths
const renderPathsCalcDiff = (target) => {
    shortestPaths = L.layerGroup()
    const graph = new WeightedGraph()
    let targetEdge
    for (const key in lineMap) {
        for (const edgeKey in lineMap[key]) {
            const edge = lineMap[key][edgeKey]
            if (edgeKey == target._leaflet_id) {
                targetEdge = edge
                console.log("found", edgeKey)
                continue
            }
            graph.addEdge(edge.src, edge.dst, edge.dist, edge.poly)
        }
    }
    if (!targetEdge) location.reload()
    const srcs = choicesEachTile()
    console.log("srcs", srcs.length)
    graph.addVertex(targetEdge.src)
    graph.addVertex(targetEdge.dst)
    const distAfter = srcs.map(src => graph.Dijkstra(src))
    graph.addEdge(
        targetEdge.src, targetEdge.dst, targetEdge.dist, targetEdge.poly
    )
    const distBefore = srcs.map(src => {
        const dist = graph.Dijkstra(src)
        srcs.forEach(dst => {
            graph.getPath(dst).forEach(line => {
                L.polyline(line.data, style.path).addTo(shortestPaths)
            })
        })
        return dist
    })
    map.addLayer(shortestPaths)
    const distDiffMax = {}
    for (const dst in graph.adjacencyList) {
        distDiffMax[dst] = Math.max(...[...Array(srcs.length).keys()].map(idx => {
            const after = distAfter[idx][dst]
            const before = distBefore[idx][dst]
            if (before === Infinity) return 0
            return after - before
        }))
    }
    return {
        distMap: distDiffMax,
        srcs: srcs
    }
}

let nodeMarkers
const renderNodes = (result) => {
    // console.log(Object.values(result.distMap).sort().reverse().filter(x => !!x))
    nodeMarkers = L.layerGroup()
    for (const node in result.distMap) {
        const dist = result.distMap[node]
        const color = dist === Infinity ? style.black
                    : dist > 0.0001 ? style.red
                    : dist > 0 ? style.yellow
                    : style.green
        L.circleMarker(eval(`[${node}]`), color).addTo(nodeMarkers)
    }
    result.srcs.forEach(src => {
        L.marker(eval(`[${src}]`)).addTo(nodeMarkers)
    })
    map.addLayer(nodeMarkers)
}

let prevLayer
map.on('almost:click', (e) => {
    if (prevLayer) {
        map.removeLayer(nodeMarkers)
        map.removeLayer(shortestPaths)
        if (prevLayer !== e.layer && prevLayer.selected) {
            prevLayer.setStyle(style.default)
            prevLayer.selected = false
        }
    }
    if (e.layer.selected) {
        e.layer.setStyle(style.default)
        e.layer.selected = false
    } else {
        e.layer.setStyle(style.clicked)
        e.layer.selected = true
        const result = renderPathsCalcDiff(e.layer)
        renderNodes(result)
    }
    prevLayer = e.layer
})

map.on("zoom", (e) => {
    if (e.target._zoom < 14) {
        if (nodeMarkers) map.removeLayer(nodeMarkers)
        if (shortestPaths) map.removeLayer(shortestPaths)
    }
})
