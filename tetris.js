//
// JavaScript Tetris, using simple divs for drawing.
//

var TETRIS = {};

TETRIS.round = function(value)
{
    if(value > 0)
        return Math.floor(value);
    else
        return Math.ceil(value);
};

TETRIS.color = function(spec)
{
    var that = {};
    
    that.name = spec.name;
    
    that.toString = function()
    {
        return 'color: ' + that.name;
    };
    
    return that;
};

TETRIS.Color =
{
    CYAN : TETRIS.color({name : 'CYAN'}),
    BLUE : TETRIS.color({name : 'BLUE'}),
    ORANGE : TETRIS.color({name : 'ORANGE'}),
    YELLOW : TETRIS.color({name : 'YELLOW'}),
    GREEN : TETRIS.color({name : 'GREEN'}),
    PURPLE : TETRIS.color({name : 'PURPLE'}),
    RED : TETRIS.color({name : 'RED'})
};

TETRIS.cell = function(spec)
{
    var that = {};
    
    that.x = spec.x;
    that.y = spec.y;
    that.color = spec.color;
    
    that.toString = function()
    {
        return 'cell: x: ' + that.x + ' y: ' + that.y + ' color: ' + that.color;
    };
    
    return that;
};

TETRIS.direction = function(spec)
{
    var that = {};
    
    that.name = spec.name;
    that.value = spec.value;
    
    that.toString = function()
    {
        return 'direction: ' + that.name;
    };
    
    return that;
};

TETRIS.Direction =
{
    CLOCKWISE : TETRIS.direction({name : 'CLOCKWISE', value : 1}),
    COUNTERCLOCKWISE : TETRIS.direction({name : 'COUNTERCLOCKWISE', value : -1})
};

TETRIS.piece = function(spec)
{
    var that = {};
    
    that.centerX = spec.centerX;
    that.centerY = spec.centerY;
    that.cells = [];
    
    if(spec.cells)
    {
        that.cells = spec.cells.slice(0);
    }
    
    if(spec.cellCoordinates && spec.cellColor)
    {
        for(var i in spec.cellCoordinates)
            that.cells.push(TETRIS.cell({x : spec.cellCoordinates[i].x, y : spec.cellCoordinates[i].y, color : spec.cellColor}));
    }
    
    that.toString = function()
    {
        var res = 'piece: ';
    
        for(var i in that.cells)
            res += that.cells[i] + ', ';

        return res;
    };
    
    that.makeTranslated = function(x, y)
    {
        var res = TETRIS.piece({cells : [], centerX : 0, centerY : 0});
        
        for(var i in that.cells)
            res.cells.push(TETRIS.cell({x : that.cells[i].x + x, y : that.cells[i].y + y, color : that.cells[i].color}));
        
        res.centerX = that.centerX + x;
        res.centerY = that.centerY + y;
        
        return res;
    };

    that.makeRotated = function(direction)
    {
        var res = TETRIS.piece({cells : [], centerX : 0, centerY : 0});
        
        for(var i in that.cells)
            res.cells.push(TETRIS.cell({
                x : direction.value * (that.centerY - that.cells[i].y) + that.centerX,
                y : direction.value * (that.cells[i].x - that.centerX) + that.centerY,
                color : that.cells[i].color}));

        res.centerX = that.centerX;
        res.centerY = that.centerY;

        return res;
    };
    
    return that;
};

TETRIS.Piece = 
{
    PIECE_I : TETRIS.piece({cellCoordinates : [{x : 0, y : 1}, {x : 1, y : 1}, {x : 2, y : 1}, {x : 3, y : 1}], cellColor : TETRIS.Color.CYAN, centerX : 1.5, centerY : 1.5}),
    PIECE_J : TETRIS.piece({cellCoordinates : [{x : 0, y : 0}, {x : 0, y : 1}, {x : 1, y : 1}, {x : 2, y : 1}], cellColor : TETRIS.Color.BLUE, centerX : 1, centerY : 1}),
    PIECE_L : TETRIS.piece({cellCoordinates : [{x : 0, y : 1}, {x : 1, y : 1}, {x : 2, y : 1}, {x : 2, y : 0}], cellColor : TETRIS.Color.ORANGE, centerX : 1, centerY : 1}),
    PIECE_O : TETRIS.piece({cellCoordinates : [{x : 1, y : 0}, {x : 2, y : 0}, {x : 1, y : 1}, {x : 2, y : 1}], cellColor : TETRIS.Color.YELLOW, centerX : 1.5, centerY : 0.5}),
    PIECE_S : TETRIS.piece({cellCoordinates : [{x : 1, y : 0}, {x : 2, y : 0}, {x : 0, y : 1}, {x : 1, y : 1}], cellColor : TETRIS.Color.GREEN, centerX : 1.5, centerY : 0.5}),
    PIECE_T : TETRIS.piece({cellCoordinates : [{x : 1, y : 0}, {x : 0, y : 1}, {x : 1, y : 1}, {x : 2, y : 1}], cellColor : TETRIS.Color.PURPLE, centerX : 1, centerY : 1}),
    PIECE_Z : TETRIS.piece({cellCoordinates : [{x : 0, y : 0}, {x : 1, y : 0}, {x : 1, y : 1}, {x : 2, y : 1}], cellColor : TETRIS.Color.RED, centerX : 1, centerY : 1})
};

TETRIS.gameState = function(spec)
{
    var that = {};
    
    that.name = spec.name;
    
    that.toString = function()
    {
        return 'game state: ' + that.name;
    };
    
    return that;
};

TETRIS.GameState = 
{
    IDLE : TETRIS.gameState({name : 'IDLE'}),
    RUNNING : TETRIS.gameState({name : 'RUNNING'}),
    PAUSED : TETRIS.gameState({name : 'PAUSED'}),
    GAMEOVER : TETRIS.gameState({name : 'GAMEOVER'}),
    FREEFALL : TETRIS.gameState({name : 'FREEFALL'})
};

TETRIS.tetrisEngine = function(spec)
{
    var INITIAL_DELAY = 50;
    var FREEFALL_DELAY = 1;
    var LINE_COST = 30;
    var PIECE_COST = 10;
    var SCORE_PER_SPEED = 800;
    var ACCELERATION_FACTOR = 1.2;
    var TIMERTICK = 20;
    
    var that = {};
    
    that.width = spec.width;
    that.height = spec.height;
    // Internals
    var listeners = [];        
    var timer;
    // Sea, piece, next piece
    that.sea;
    that.piece;
    that.nextPiece;
    // Parameters
    that.lineCount;
    that.pieceCount;
    that.score;
    that.speed;        
    var delay;
    var moveTimer;
    that.gameState;
    
    var getRandomPiece = function()
    {
        var pieces = [];
        
        for(var i in TETRIS.Piece)
            pieces.push(TETRIS.Piece[i]);
        
        return pieces[TETRIS.round(Math.random() * pieces.length)];
    };

    var initParameters = function()
    {
        that.lineCount = 0;
        that.pieceCount = 0;
        that.score = 0;
        that.speed = 1;        
        delay = INITIAL_DELAY;
        moveTimer = 0;
        that.gameState = TETRIS.GameState.IDLE;
    };
    
    var initSea = function()
    {
        that.sea = [];
    };
    
    var initPieces = function()
    {
        that.piece = null;
        that.nextPiece = getRandomPiece();
    };
    
    var postUpdate = function()
    {
        for(var i in listeners)
            listeners[i].changeNotify(that);
    };

    var adjustScoreSpeedDelay = function()
    {
        that.score = TETRIS.round(that.lineCount * LINE_COST + that.pieceCount * PIECE_COST);
        that.speed = TETRIS.round(that.speed < 10 ? that.score / SCORE_PER_SPEED + 1 : 10);
        delay = TETRIS.round(INITIAL_DELAY / Math.exp(Math.log(ACCELERATION_FACTOR) * (that.speed - 1)));
        postUpdate();
    };

    var isCellInside = function(cell)
    {
        if(cell.x >= 0 && cell.x < that.width && cell.y >= 0 && cell.y < that.height)
                return(true);
        return(false);
    };

    var isSeaContainingXY = function(x, y)
    {
        for(var i in that.sea)
            if(that.sea[i].x === x && that.sea[i].y === y)
                return true;
        return false;
    };

    var isSeaContainingCell = function(cell)
    {
        return isSeaContainingXY(cell.x, cell.y);
    };

    var isSeaOverlapping = function(piece)
    {
        for(var i in piece.cells)
            if(isSeaContainingCell(piece.cells[i]))
                return true;
        return false;
    };

    var isPieceInside = function(piece)
    {
        for(var i in piece.cells)
            if(!isCellInside(piece.cells[i]))
                return false;
        return true;
    };

    var translatePiece = function(x, y)
    {
        if(!that.piece)
            return false;
                
        var newPiece = that.piece.makeTranslated(x, y);

        if(isSeaOverlapping(newPiece) || !isPieceInside(newPiece))
            return false;
        
        that.piece = newPiece;

        postUpdate();
        
        return true;
    };

    var rotatePiece = function(direction)
    {
        if(!that.piece)
            return false;

        var newPiece = that.piece.makeRotated(direction);

        if(isSeaOverlapping(newPiece) || !isPieceInside(newPiece))
            return false;
        
        that.piece = newPiece;

        postUpdate();
        
        return true;
    };

    var pumpoutSea = function()
    {
        var full_lines = 0;

        for(var i = 0; i < that.height; i++)
        {
            var full_line = true;
            for(var j = 0; j < that.width; j++)
            {
                if(!isSeaContainingXY(j, i))
                {
                    full_line = false;
                    break;
                }
            }
            if(full_line)
            {
                full_lines++;

                var newSea = [];
                for(var k in that.sea)
                {
                    if(that.sea[k].y < i)
                        newSea.push(TETRIS.cell({x : that.sea[k].x, y : that.sea[k].y + 1, color : that.sea[k].color}));
                    else
                        if(that.sea[k].y > i)
                            newSea.push(that.sea[k]);
                }
                that.sea = newSea;
            }
        }
        
        return full_lines;
    };

    var sinkPiece = function()
    {
        if(!that.piece)
            return;

        that.sea = that.sea.concat(that.piece.cells);
        
        that.piece = null;
        
        that.lineCount += pumpoutSea();

        adjustScoreSpeedDelay();
        
        postUpdate();                
    };

    var stopTimer = function()
    {
        clearInterval(timer);
    };

    var gameOver = function()
    {
        stopTimer();
        that.piece = null;
        that.gameState = TETRIS.GameState.GAMEOVER;
        postUpdate();
    };

    var newPiece = function()
    {
        that.piece = that.nextPiece.makeTranslated(that.width / 2 - 2, 0);
        if(isSeaOverlapping(that.piece))
        {
            gameOver();
            return;
        }
        
        that.pieceCount++;
        
        adjustScoreSpeedDelay();
        
        that.nextPiece = getRandomPiece();
        
        moveTimer = delay;
        
        postUpdate();
    };

    var timerEventHandler = function()
    {
        // console.log('tick, tetrisEngine: ' + that);
        // console.log('state: ' + that.gameState);
        
        if(moveTimer !== 0)
        {
            moveTimer--;
                return;
        }

        if(that.gameState === TETRIS.GameState.RUNNING)
        {
            if(!that.piece)
            {
                newPiece();
                return;
            }

            if(!translatePiece(0, 1))
            {
                sinkPiece();
                return;
            }
            
            moveTimer = delay;
            
            return;
        }
        else if(that.gameState === TETRIS.GameState.FREEFALL)
        {
            if(!that.piece)
            {
                that.gameState = TETRIS.GameState.RUNNING;
                
                return;
            }

            if(!translatePiece(0, 1))
            {
                sinkPiece();
                return;
            }
            
            moveTimer = FREEFALL_DELAY;
            
            return;
        }
        else
        {
            return;
        }
    };
    
    var startTimer = function()
    {
        timer = setInterval(timerEventHandler, TIMERTICK);
    };

    var freeFall = function()
    {
        if(that.gameState === TETRIS.GameState.RUNNING)
        {
            that.gameState = TETRIS.GameState.FREEFALL;
            moveTimer = 0;
        }
    };

    that.toString = function()
    {
        var res = 'tetris: ';
        
        res += 'width: ' + that.width + ', ';
        res += 'height: ' + that.height + ', ';
        res += 'lineCount: ' + that.lineCount + ', ';
        res += 'pieceCount: ' + that.pieceCount + ', ';
        res += 'score: ' + that.score + ', ';
        res += 'speed: ' + that.speed + ', ';
        res += 'delay: ' + delay + ', ';
        res += 'moveTimer: ' + moveTimer + ', ';
        res += 'gameState: ' + that.gameState + ', ';
        res += 'nextPiece: ' + that.nextPiece + ', ';
        res += 'piece: ' + that.piece + ', ';
        res += 'sea: ' + that.sea;
        
        return res;
    };
    
    that.start = function()
    {
        if(that.gameState === TETRIS.GameState.IDLE)
        {
            that.gameState = TETRIS.GameState.RUNNING;                
            startTimer();                
            postUpdate();
        }
    };
    
    that.stop = function()
    {
        if(that.gameState !== TETRIS.GameState.IDLE)
        {
            stopTimer();
            
            initParameters();                
            initSea();                
            initPieces();
            
            gameState = TETRIS.GameState.IDLE;
            postUpdate();
        }
    };
    
    that.pause = function()
    {
        if(that.gameState === TETRIS.GameState.RUNNING)
        {
            that.gameState = TETRIS.GameState.PAUSED;
            stopTimer();
            postUpdate();
        }                
    };
            
    that.resume = function()
    {
        if(that.gameState === TETRIS.GameState.PAUSED)
        {        
            that.gameState = TETRIS.GameState.RUNNING;
            startTimer();
            postUpdate();
        }                
    };

    var isInputAccepted = function()
    {
        if(that.gameState === TETRIS.GameState.RUNNING || that.gameState === TETRIS.GameState.FREEFALL)
            return true;
        return false;
    };

    that.movePieceLeft = function()
    {
        if(isInputAccepted())
            translatePiece(-1, 0);                
    };

    that.movePieceRight = function()
    {
        if(isInputAccepted())
            translatePiece(1, 0);
    };
    
    that.rotatePieceCounterclockwise = function()
    {
        if(isInputAccepted())
            rotatePiece(TETRIS.Direction.COUNTERCLOCKWISE);
    };
    
    that.rotatePieceClockwise = function()
    {
        if(isInputAccepted())
            rotatePiece(TETRIS.Direction.CLOCKWISE);
    };
    
    that.dropPiece = function()
    {
        if(that.gameState === TETRIS.GameState.RUNNING)
            freeFall();
    };
        
    that.addListener = function(listener)
    {
        listeners.push(listener);
    };
    
    that.removeListener = function(listener)
    {
        var newListeners = [];
        for(var i in that.listeners)
            if(that.listeners[i] !== listener)
                newListeners.push(that.listeners[i]);
        that.listeners = newListeners;
    };
        
    initParameters();
    
    initSea();
    
    initPieces();
        
    return that;
};

TETRIS.rect = function(spec)
{
    var that = {};
    
    that.left = spec.left;
    that.top = spec.top;
    that.right = spec.right;
    that.bottom = spec.bottom;
    
    that.width = function()
    {
        return that.right - that.left;
    };
    
    that.height = function()
    {
        return that.bottom - that.top;
    };

    return that;
};

TETRIS.point = function(spec)
{
    var that = {};
    
    that.x = spec.x;
    that.y = spec.y;
    
    return that;
};

TETRIS.tetrisView = function(spec)
{
    var FIELD_PADDING = 5;
    var FIELD_BORDER = 2;
    var TEXT_PADDING = 1;
    var MAX_TEXT_SIZE = 12;
    var PREVIEW_WIDTH = 5;
    var PREVIEW_HEIGHT = 5;
    var MAX_CELL_SIZE = 23;
    var GRID_COLOR = '#404040';
    var FIELD_COLOR = 'black';
    var BORDER_COLOR = 'white';
    var STATS_COLOR = 'white';
    var BACKGROUND_COLOR = 'gray';        
    var SCORE_HEADING = 'Score';
    var LINES_HEADING = 'Lines';
    var SPEED_HEADING = 'Speed';
    var PIECES_HEADING = 'Pieces';

    var that = {};
    var tetrisEngine = spec.tetrisEngine;        
    var isPreviewShown = true;
    var isGridShown = true;
    var previousGameState;
    var sea = [];
    var piece = [];
    var preview = [];
    var grid = [];
    var stats = [];
    var cellSize;
    var previewRect;
    var glassRect;
    var statsRect;
    var colorToImage;
        
    var handleKeypress = function(e)
    {
        if(typeof(e) === 'undefined')
            e = window.event;
        
        if((e.charCode || e.keyCode) === 32)
            tetrisEngine.dropPiece();
    };

    var handleKeydown = function(e)
    {
        if(typeof(e) === 'undefined')
            e = window.event;
        
        if(e.keyCode === 37)
            tetrisEngine.movePieceLeft();
        
        if(e.keyCode === 39)
            tetrisEngine.movePieceRight();

        if(e.keyCode === 40)
            tetrisEngine.rotatePieceClockwise();
        
        if(e.keyCode === 38)
            tetrisEngine.rotatePieceCounterclockwise();
    };

    var getWindowDimensions = function()
    {
        if(typeof(window.innerWidth) === 'number')
        {
            width = window.innerWidth;
            height = window.innerHeight;
        }
        else if(document.documentElement && (document.documentElement.clientWidth)) 
        {
            width = document.documentElement.clientWidth;
            height = document.documentElement.clientHeight;
        }
        else if(document.body && (document.body.clientWidth))
        {
            width = document.body.clientWidth;
            height = document.body.clientHeight;
        }
        return {'width' : width, 'height' : height};
    };
        
    var getWidth = function()
    {
        return getWindowDimensions().width;
    };
        
    var getHeight = function()
    {
        return getWindowDimensions().height;
    };
        
    var getCellSize = function()
    {
        var width = getWidth() - FIELD_PADDING * 3 + FIELD_BORDER * 4;
        var height = getHeight() - (FIELD_PADDING + FIELD_BORDER) * 2;                
        var res = TETRIS.round(Math.min(height / tetrisEngine.height, width / (tetrisEngine.width + PREVIEW_WIDTH)));
        if(res > MAX_CELL_SIZE)
            res = MAX_CELL_SIZE;
        return res;
    };
        
    var getCellRect = function(cell, fieldRect, offsetPoint)
    {
        var left = fieldRect.left + offsetPoint.x + cell.x * cellSize;
        var top = fieldRect.top + offsetPoint.y + cell.y * cellSize;
        var right = left + cellSize;
        var bottom = top + cellSize;
        
        return TETRIS.rect({left : left, top : top, right : right, bottom : bottom});
    };

    var getGlassHeight = function()
    {
        return tetrisEngine.height * cellSize;
    };
        
    var getGlassWidth = function()
    {
        return tetrisEngine.width * cellSize;
    };

    var getPreviewHeight = function()
    {
        return PREVIEW_HEIGHT * cellSize;
    };

    var getPreviewWidth = function()
    {
        return PREVIEW_WIDTH * cellSize;
    };
        
    var getPreviewCellOffset = function()
    {
        var minX = PREVIEW_WIDTH;
        var maxX = 0;
        var minY = PREVIEW_HEIGHT;
        var maxY = 0;
        for(var i in tetrisEngine.nextPiece.cells)
        {
            if(tetrisEngine.nextPiece.cells[i].x > maxX)
                maxX = tetrisEngine.nextPiece.cells[i].x;
            if(tetrisEngine.nextPiece.cells[i].x < minX)
                minX = tetrisEngine.nextPiece.cells[i].x;
            if(tetrisEngine.nextPiece.cells[i].y > maxY)
                maxY = tetrisEngine.nextPiece.cells[i].y;
            if(tetrisEngine.nextPiece.cells[i].y < minY)
                minY = tetrisEngine.nextPiece.cells[i].y;
        }
        var x = TETRIS.round(PREVIEW_WIDTH * cellSize / 2 - cellSize * (minX + maxX + 1) / 2);
        var y = TETRIS.round(PREVIEW_HEIGHT * cellSize / 2 - cellSize * (minY + maxY + 1) / 2);        
        
        return TETRIS.point({x : x, y : y});
    };
    
    var getPreviewRect = function()
    {
        var left = TETRIS.round(getWidth() / 2 - (getGlassWidth() + getPreviewWidth() + FIELD_PADDING * 3 + FIELD_BORDER * 4) / 2 + FIELD_PADDING + FIELD_BORDER);
        var top = TETRIS.round(getHeight() / 2 - getGlassHeight() / 2);
        var right = left + getPreviewWidth();
        var bottom = top + getPreviewHeight();

        return TETRIS.rect({left : left, top : top, right : right, bottom : bottom});
    };
        
    var getGlassRect = function()
    {
        var left = getPreviewRect().right + FIELD_BORDER * 2 + FIELD_PADDING;
        var top = getPreviewRect().top;
        var right = left + getGlassWidth();
        var bottom = top + getGlassHeight();

        return TETRIS.rect({left : left, top : top, right : right, bottom : bottom});
    };
        
    var getStatsRect = function()
    {
        var left = getPreviewRect().left;
        var top = getPreviewRect().bottom + FIELD_BORDER * 2 + FIELD_PADDING;
        var right = previewRect.right;
        var bottom = glassRect.bottom;
        
        return TETRIS.rect({left : left, top : top, right : right, bottom : bottom});
    };
        
    var getControlsRect = function()
    {
        var left = getGlassRect().right + FIELD_BORDER * 2 + FIELD_PADDING;
        var top = getGlassRect().top;
        var right = left + getPreviewWidth();
        var bottom = top + getGlassHeight();
        
        return TETRIS.rect({left : left, top : top, right : right, bottom : bottom});
    };

    var removeElements = function(elements)
        {
        for(var i in elements)
            document.body.removeChild(elements[i]);
        elements.length = 0;
    };

    var drawRect = function(rect, color, borderWidth, borderColor)
    {
        var div = document.createElement('div');
        document.body.appendChild(div);
        div.style.position = 'absolute';
        div.style.left = rect.left + 'px';
        div.style.top = rect.top + 'px';
        div.style.width = rect.width() + 'px';
        div.style.height = rect.height() + 'px';
        div.style.background = color;
        if(borderWidth && borderColor)
        {
            div.style.left = rect.left - borderWidth + 'px';
            div.style.top = rect.top - borderWidth + 'px';
            div.style.border = borderColor + ' ' + borderWidth + 'px solid';
        }
        return div;
    };
    
    var drawCellIntoRect = function(cell, rect)
    {
        var div = document.createElement('div');
        document.body.appendChild(div);
        div.style.position = 'absolute';
        div.style.left = rect.left + 'px';
        div.style.top = rect.top + 'px';
        div.style.width = rect.right - rect.left + 'px';
        div.style.height = rect.bottom - rect.top + 'px';
        div.innerHTML = '<img src="' + colorToImage[cell.color.name] + '" width=' + cellSize + ' height=' + cellSize + '"/>';
        return div;
    };

    var drawField = function(rect)
    {
        drawRect(rect, FIELD_COLOR, FIELD_BORDER, BORDER_COLOR);
    };
        
    var drawCell = function(cell)
    {
        return drawCellIntoRect(cell, getCellRect(cell, glassRect, TETRIS.point({x : 0, y : 0})));
    };
        
    var drawPreviewCell = function(cell)
    {
        return drawCellIntoRect(cell, getCellRect(cell, previewRect, getPreviewCellOffset()));
    };
    
    var hideGrid = function()
    {
        removeElements(grid);
    };
        
    var drawGrid = function()
    {
        removeElements(grid);
        
        for(var i = 0; i < tetrisEngine.width; i++)
        {
            var div = drawRect(TETRIS.rect(
            {
                left : glassRect.left + i * cellSize,
                top : glassRect.top,
                right : glassRect.left + i * cellSize + 1,
                bottom : glassRect.bottom
            }), GRID_COLOR);
            grid.push(div);
                
            var div2 = drawRect(TETRIS.rect(
            {
                left : glassRect.left + cellSize * (i + 1)  - 1,
                top : glassRect.top,
                right : glassRect.left + cellSize * (i + 1) - 1 + 1,
                bottom : glassRect.bottom
            }), GRID_COLOR);
            grid.push(div2);
        }
            
        for(var i = 0; i < tetrisEngine.height; i++)
        {
            var div = drawRect(TETRIS.rect(
            {
                left : glassRect.left,
                top : glassRect.top + cellSize * i,
                right : glassRect.right,
                bottom :glassRect.top + cellSize * i + 1
            }), GRID_COLOR);
            grid.push(div);

            var div2 = drawRect(TETRIS.rect(
            {
                left : glassRect.left,
                top : glassRect.top + cellSize * (i + 1) - 1,
                right : glassRect.right,
                bottom : glassRect.top + cellSize * (i + 1) - 1 + 1
            }), GRID_COLOR);
            grid.push(div2);
        }
    };

    var drawStats = function()
    {
        var statsText = [];
        statsText.push(SCORE_HEADING);
        statsText.push(tetrisEngine.score);
        statsText.push(LINES_HEADING);
        statsText.push(tetrisEngine.lineCount);
        statsText.push(SPEED_HEADING);
        statsText.push(tetrisEngine.speed);
        statsText.push(PIECES_HEADING);
        statsText.push(tetrisEngine.pieceCount);

        var lineHeight = statsRect.height() / statsText.length;
        var fontHeight = lineHeight - TEXT_PADDING > MAX_TEXT_SIZE ? MAX_TEXT_SIZE : lineHeight - TEXT_PADDING;
        
        removeElements(stats);
        for(var i = 0; i < statsText.length; i++)
        {
            var div = document.createElement('div');
            stats.push(div);
            document.body.appendChild(div);
            div.style.position = 'absolute';
            div.style.left = statsRect.left + 'px';
            div.style.top = statsRect.top + i * lineHeight + statsRect.height() / statsText.length / 2 - fontHeight / 2 + 'px';                	
            div.style.width = statsRect.width() + 'px';
            div.style.height = fontHeight + 'px';
            div.style.background = FIELD_COLOR;
            div.style.color = STATS_COLOR;
            div.style.fontSize = fontHeight + 'px';
            div.style.textAlign = 'center';
            div.innerHTML = statsText[i];
        }
    };
        
    var drawSea = function()
    {
        removeElements(sea);
        if(tetrisEngine.sea)
            for(var i in tetrisEngine.sea)
            {
                var div = drawCell(tetrisEngine.sea[i]);
                sea.push(div);
            }
    };
        
    var drawPiece = function()
    {
        removeElements(piece);
        if(tetrisEngine.piece)
            for(var i in tetrisEngine.piece.cells)
            {
                var div = drawCell(tetrisEngine.piece.cells[i]);
                piece.push(div);
            }
    };
        
    var hidePreview = function()
    {
        removeElements(preview);
    };
        
    var drawPreview = function()
    {
        removeElements(preview);
        if(tetrisEngine.nextPiece)
            for(var i in tetrisEngine.nextPiece.cells)
            {
                var div = drawPreviewCell(tetrisEngine.nextPiece.cells[i]);
                preview.push(div);
            }
    };

    var setBackground = function()
    {
        document.bgColor = BACKGROUND_COLOR;
    };
        
    var initInputHandling = function()
    {
        document.onkeypress = handleKeypress;
        document.onkeydown = handleKeydown;
    };
        
    var initRects = function()
    {
        cellSize = getCellSize();
        previewRect = getPreviewRect();
        glassRect = getGlassRect();
        statsRect = getStatsRect();
    };
        
    var initColorToImage = function()
    {
        colorToImage = {};
        colorToImage[TETRIS.Color.CYAN.name] = 'cell_cyan.png';
        colorToImage[TETRIS.Color.BLUE.name] = 'cell_blue.png';
        colorToImage[TETRIS.Color.ORANGE.name] = 'cell_orange.png';
        colorToImage[TETRIS.Color.YELLOW.name] = 'cell_yellow.png';
        colorToImage[TETRIS.Color.GREEN.name] = 'cell_green.png';
        colorToImage[TETRIS.Color.PURPLE.name] = 'cell_magenta.png';
        colorToImage[TETRIS.Color.RED.name] = 'cell_red.png';
    };
        
    var initNewGameButton = function(e)
    {
        var buttonNewGame = document.createElement('input');
        buttonNewGame.value = 'New game';
        buttonNewGame.type = 'button';
        buttonNewGame.onclick = function()
        {
            if(tetrisEngine)
            {
                tetrisEngine.stop();
                tetrisEngine.start();
            }
            buttonNewGame.blur();
        };
        e.appendChild(buttonNewGame);
    };
        
    var initPauseResumeButton = function(e)
    {
        var buttonPauseResume = document.createElement('input');
        buttonPauseResume.value = 'Pause';
        buttonPauseResume.type = 'button';
        buttonPauseResume.onclick = function()
        {
            if(tetrisEngine)
            {
                if(tetrisEngine.gameState === TETRIS.GameState.PAUSED)
                {	
                    buttonPauseResume.value = 'Pause';
                    tetrisEngine.resume();
                }
                else if(tetrisEngine.gameState === TETRIS.GameState.RUNNING)
                {	
                    buttonPauseResume.value = 'Resume';
                    tetrisEngine.pause();
                }
                buttonPauseResume.blur();
            }
        };
        e.appendChild(buttonPauseResume);
    };
        
    var initCheckboxShowPreview = function(e)
    {
        var checkboxShowPreview = document.createElement('input');
        checkboxShowPreview.name = 'Show preview';
        checkboxShowPreview.type = 'checkbox';
        checkboxShowPreview.defaultChecked = true;
        checkboxShowPreview.id = 'showPreview';
        checkboxShowPreview.onclick = function()
        {
            if(checkboxShowPreview.checked)
            {
                isPreviewShown = true;
                drawPreview();
            }
            else
            {
                isPreviewShown = false;
                hidePreview();
            }
            
            checkboxShowPreview.blur();
        };
        e.appendChild(checkboxShowPreview);
        
        var checkboxShowPreviewLabel = document.createElement('label');
        checkboxShowPreviewLabel.htmlFor = 'showPreview';
        checkboxShowPreviewLabel.appendChild(document.createTextNode('Show preview'));
        e.appendChild(checkboxShowPreviewLabel);
    };
        
    var initCheckboxShowGrid = function(e)
    {
        var checkboxShowGrid = document.createElement('input');
        checkboxShowGrid.name = 'Show grid';
        checkboxShowGrid.type = 'checkbox';
        checkboxShowGrid.defaultChecked = true;
        checkboxShowGrid.id = 'showGrid';
        checkboxShowGrid.onclick = function()
        {
            if(checkboxShowGrid.checked)
            {
                isGridShown = true;
                drawGrid();
            }
            else
            {
                isGridShown = false;
                hideGrid();
            }
            
            checkboxShowGrid.blur();
        };
        e.appendChild(checkboxShowGrid);
        
        var checkboxShowGridLabel = document.createElement('label');
        checkboxShowGridLabel.htmlFor = 'showGrid';
        checkboxShowGridLabel.appendChild(document.createTextNode('Show grid'));
        e.appendChild(checkboxShowGridLabel);
    };
        
    var wrapInParagraph = function(elementInit)
    {
        var p = document.createElement('p');
        p.style.textAlign = 'left';
        elementInit(p);
        return p;
    };
        
    var initControls = function()
    {
        var rect = getControlsRect();

        var div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = rect.left + 'px';
        div.style.top = rect.top + 'px';           	
        div.style.width = rect.width() + 'px';
        div.style.height = rect.height() + 'px';
        document.body.appendChild(div);
        
        div.appendChild(wrapInParagraph(initNewGameButton));
        div.appendChild(wrapInParagraph(initPauseResumeButton));
        div.appendChild(wrapInParagraph(initCheckboxShowPreview));
        div.appendChild(wrapInParagraph(initCheckboxShowGrid));
    };
        
    var initFields = function()
    {
        setBackground();
        
        drawField(glassRect);
        
        drawField(previewRect);
        
        drawField(statsRect);
    };
        
    var initGrid = function()
    {
        if(isGridShown)
            drawGrid();
    };
        
    that.changeNotify = function(tetrisEngine)
    {		
        if(!tetrisEngine)
            return;
        
        if(tetrisEngine.gameState === TETRIS.GameState.GAMEOVER && tetrisEngine.gameState !== previousGameState)
            window.alert('Game over!');
        previousGameState = tetrisEngine.gameState;
  
        drawSea();

        drawPiece();
            
        if(isPreviewShown)
            drawPreview();

        drawStats();
    };

    initColorToImage();
    
    initRects();
    
    initInputHandling();

    initControls();
    
    initFields();
    
    initGrid();

    return that;
};

TETRIS.main = function()
{
    var engine = TETRIS.tetrisEngine({width : 10, height : 20});
    
    var view = TETRIS.tetrisView({tetrisEngine : engine});
    
    engine.addListener(view);
    
    engine.start();
};
