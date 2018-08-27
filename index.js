// Make an instance of two and place it on the page.
const WIDTH = window.width
const HEIGHT = window.height

const ROWS = 6
const COLS = 7

const CELL_SIZE = 70
const CELL_PAD = 15
const OUTER_PAD = 20

const FLIP_PERIOD = 0.7
const FLIP_FALL_RATIO = 0.5

const RED = 'rgb(200, 0, 0)'
const YELLOW = 'rgb(200, 200, 0)'

const params = {
  fullscreen: true,
  autostart: true,
}

const testGame = [
  [true, false, false],
  [true, false, false, false],
  [false, true],
  [],
  [true, false, false, false, true],
  [true, false, false, false],
  [false, true],
]

function posOfRowCol(row, col) {
  return {
    x: (col - 3) * (CELL_SIZE + CELL_PAD),
    y: -((row - 2.5) * (CELL_SIZE + CELL_PAD)),
  }
}

function smoothStep(x) {
  return x * x * x * (x * (x * 6 - 15) + 10)
}

function invCubic(x) {
  return 1 - x * x * x
}

const two = new Two(params).appendTo(document.body)

const board = two.makeGroup()
board.translation.set(two.width / 2, two.height / 2)

const boardWidth = OUTER_PAD * 2 + COLS * (CELL_SIZE + CELL_PAD) + CELL_PAD
const boardHeight = OUTER_PAD * 2 + ROWS * (CELL_SIZE + CELL_PAD) + CELL_PAD
const boardSquare = two.makeRoundedRectangle(0, 0, boardWidth, boardHeight)
boardSquare.fill = 'rgb(0, 150, 200)'
board.add(boardSquare)

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    pos = posOfRowCol(row, col)
    const circ = two.makeCircle(pos.x, pos.y, CELL_SIZE / 2)
    circ.noStroke()

    circ.fill = 'rgb(0, 75, 100)'
    board.add(circ)
  }
}

redCache = []
yellowCache = []

for (let i = 0; i < ROWS * COLS; i++) {
  const red = two.makeCircle(-1000000, -100000, CELL_SIZE / 2)
  const yellow = two.makeCircle(-1000000, -100000, CELL_SIZE / 2)
  red.fill = RED
  yellow.fill = YELLOW

  redCache.push(red)
  yellowCache.push(yellow)

  board.add(red)
  board.add(yellow)
}

function piecesDuringFlip(t) {
  // Render the game pieces
  const g = two.makeGroup()

  for (let colId = 0; colId < COLS; colId++) {
    for (let rowId = 0; rowId < testGame[colId].length; rowId++) {
      const beforeFallT = ((ROWS - rowId - 1) / ROWS) * (1 - FLIP_FALL_RATIO)
      const afterFallLen = 1 - FLIP_FALL_RATIO - beforeFallT
      const afterFallT = 1 - afterFallLen

      const color = testGame[colId][rowId]

      const prePos = posOfRowCol(rowId, colId)
      const rowDiff = ROWS - testGame[colId].length
      const postPos = posOfRowCol(rowId + rowDiff, colId)

      let finalPos = null
      if (t < beforeFallT) {
        finalPos = prePos
      } else if (t > afterFallT) {
        finalPos = postPos
      } else {
        const animT = (t - beforeFallT) / FLIP_FALL_RATIO
        const lerpedY = smoothStep(animT) * (postPos.y - prePos.y) + prePos.y
        finalPos = {x: prePos.x, y: lerpedY}
      }

      const idx = rowId * COLS + colId
      if (color) {
        redCache[idx].translation.set(finalPos.x, finalPos.y)
      } else {
        yellowCache[idx].translation.set(finalPos.x, finalPos.y)
      }
    }
  }

  return g
}

function resetPieces() {
  for (let red of redCache) {
    red.translation.set(-1000000, -10000000)
  }
  for (let yellow of yellowCache) {
    yellow.translation.set(-1000000, -10000000)
  }
}

function invertGame() {
  testGame.reverse()
  for (let col of testGame) {
    col.reverse()
  }
}

let lastT = null

two.bind('update', frameCount => {
  const t = (frameCount % (60 * FLIP_PERIOD)) / (60 * FLIP_PERIOD)
  if (lastT == null) {
    lastT = t
  } else if (t < lastT) {
    invertGame()
  }
  lastT = t

  resetPieces()
  piecesDuringFlip(t)
  const rot = Math.PI * smoothStep(t)
  board.rotation = rot
})

// Don't forget to tell two to render everything
// to the screen
two.update()
