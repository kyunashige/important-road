// 下記サイトを参考に作成（WeightedGraph の実装を変更）
// "https://gist.githubusercontent.com/Prottoy2938/66849e04b0bac459606059f5f9f3aa1a/raw/42c7e50a5440a225696f36f7b406295eeb7c21e6/Dijkstra's-algorithm.js"

class Node {
    constructor(val, priority) {
        this.val = val
        this.priority = priority
    }
}

class PriorityQueue {
    constructor() {
        this.values = []
    }
    isEmpty() {
        return this.values.length == 0
    }
    enqueue(val, priority) {
        const newNode = new Node(val, priority)
        this.values.push(newNode)
        this.bubbleUp()
    }
    bubbleUp() {
        let idx = this.values.length - 1
        const element = this.values[idx]
        while (idx > 0) {
            const parentIdx = Math.floor((idx - 1) / 2)
            const parent = this.values[parentIdx]
            if (element.priority >= parent.priority) break
            this.values[parentIdx] = element
            this.values[idx] = parent
            idx = parentIdx
        }
    }
    dequeue() {
        const min = this.values[0]
        const end = this.values.pop()
        if (this.values.length > 0) {
            this.values[0] = end
            this.sinkDown()
        }
        return min
    }
    sinkDown() {
        let idx = 0
        const length = this.values.length
        const element = this.values[0]
        while (true) {
            const leftChildIdx = 2 * idx + 1
            const rightChildIdx = 2 * idx + 2
            let leftChild, rightChild
            let swap = null
            if (leftChildIdx < length) {
                leftChild = this.values[leftChildIdx]
                if (leftChild.priority < element.priority) {
                    swap = leftChildIdx
                }
            }
            if (rightChildIdx < length) {
                rightChild = this.values[rightChildIdx]
                if (
                    (swap === null && rightChild.priority < element.priority) ||
                    (swap !== null && rightChild.priority < leftChild.priority)
                ) {
                    swap = rightChildIdx
                }
            }
            if (swap === null) break
            this.values[idx] = this.values[swap]
            this.values[swap] = element
            idx = swap
        }
    }
}

class WeightedGraph {
    constructor() {
        this.adjacencyList = {}
        this.prev = {}
    }
    addVertex(vertex) {
        if (!this.adjacencyList[vertex]) this.adjacencyList[vertex] = []
        return this.adjacencyList[vertex]
    }
    addEdge(vertex1, vertex2, weight, data) {
        this.addVertex(vertex1).push({
            src: vertex1,
            dst: vertex2,
            weight,
            data
        })
        this.addVertex(vertex2).push({
            src: vertex2,
            dst: vertex1,
            weight,
            data
        })
    }
    Dijkstra(start) {
        const nodes = new PriorityQueue()
        const dists = {}
        let smallest
        for (const vertex in this.adjacencyList) {
            const initWeight = vertex === start ? 0 : Infinity
            dists[vertex] = initWeight
            this.prev[vertex] = null
        }
        nodes.enqueue(start, 0)
        while (!nodes.isEmpty()) {
            smallest = nodes.dequeue().val
            // if (dists[smallest] !== Infinity) continue
            for (const neighbor in this.adjacencyList[smallest]) {
                const edge = this.adjacencyList[smallest][neighbor]
                const candidate = dists[smallest] + edge.weight
                if (candidate < dists[edge.dst]) {
                    dists[edge.dst] = candidate
                    this.prev[edge.dst] = edge
                    nodes.enqueue(edge.dst, candidate)
                }
            }
        }
        return dists
    }
    getPath(goal) {
        let path = []
        let edge = this.prev[goal]
        while (edge) {
            path.push(edge)
            edge = this.prev[edge.src]
        }
        return path.reverse()
    }
}
