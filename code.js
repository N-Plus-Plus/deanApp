document.addEventListener(`DOMContentLoaded`, function () { onLoad(); } );
window.addEventListener(`mousedown`, function (e) { clicked( e.target ) } );
// window.addEventListener(`mouseover`, function (e) { sel( e.target, true ) } );
// window.addEventListener(`mouseout`, function (e) { sel( e.target, false ) } );


function onLoad(){
    buildBoard( 0, 10 );
    buildBar();
    setInterval(() => {
        if( state.anim ){ doAnim( false ); }
        else{ mine(); }
    }, state.tickTime );
}

function clicked( e ){}

function sel( e, on ){
    if( e.classList.contains( `tile` ) ){
        let x = parseInt( e.getAttribute( `data-x` ) );
        let y = parseInt( e.getAttribute( `data-y` ) );
        if( on ){
            state.target = { x: x, y: y }            
        }
        else{
            if( state.target.x == x && state.target.y == y ){
                state.target = { x: null, y: null }
            }
        }
    }
}

function mine(){
    if( state.target.x !== null && state.target.y !== null ){
        let a = board[`l${state.l}`][`x${state.target.x}`][`y${state.target.y}`];
        if( !a.gone && a.seen ){
            a.wear += getAmount();
            if( a.wear >= types[a.type].tough ){
                bustBlock( state.target.x, state.target.y, true );
            }
            else{
                addCrack( state.target.x, state.target.y );
            }
        }
    }
}

function addCrack( x, y ){
    let a = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    let c = document.createElement(`div`);
    c.classList = `crack${ Math.floor( Math.random() * 4 ) }`;
    c.style.transform = `rotate(${ Math.floor( Math.random() * 4 ) * 90 }deg)`
    a.children[0].appendChild(c);
}

function bustBlock( x, y, yield ){
    let a = board[`l${state.l}`][`x${x}`][`y${y}`];
    a.gone = true;
    let b = document.querySelector(`[data-x="${x}"][data-y="${y}"]`)
    b.classList.add(`destroyed`);
    b.innerHTML = ``;
    if( yield ){ gainRes( a.type ) };
    reveal( getNeighbours( x, y, true ) );
    if( state.miner.pos !== undefined ){ moveMiner( x, y, false ); }
}

function reveal( arr ){
    for( i in arr ){
        board[`l${state.l}`][`x${arr[i].x}`][`y${arr[i].y}`].seen = true;
        let b = document.querySelector(`[data-x="${arr[i].x}"][data-y="${arr[i].y}"]`);
        if( b.classList.contains(`destroyed`) ){}
        else{
            b.children[0].children[0].classList.remove(`fow`);
        }
    }
}

function moveMiner( x, y, initial ){
    let legacy = document.querySelector(`.minerCell`);
    if( legacy !== null ){ legacy.parentElement.removeChild( legacy ); }
    let target = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    if( initial ){
        state.miner.pos = { x: x, y: y };
        state.miner.dir = { x: 0, y: 1 };
        target.appendChild( minerDiv() );
    }
    else{
        // let old = document.querySelector(`[data-x="${state.miner.pos.x}"][data-y="${state.miner.pos.y}"]`);
        // slide from prior pos + animation delay
        state.miner.old = { x: state.miner.pos.x, y: state.miner.pos.y }
        state.miner.pos = { x: x, y: y };
        if( state.miner.dir.x == 1 ){
            state.miner.dir.x = 0;
            if( state.miner.pos.y == 0 ){ state.miner.dir.y = 1; }
            else{ state.miner.dir.y = -1 }
        }
        else{
            if( state.miner.pos.y == 0 || state.miner.pos.y == state.y - 1 ){ state.miner.dir = { x: 1, y: 0 } }            
        }
        target.appendChild( minerDiv() );
        doAnim( true );
        shiftInnards();
    }
    state.target = { x: mineTarget().x, y: mineTarget().y };
    if( state.miner.pos.x >= state.x - state.thresh ){
        addRows( state.l, state.thresh );
        shiftField( state.thresh );
        setTimeout(() => {
            killRows( state.l, state.thresh );
        }, state.delay );
    }
}

function doAnim( on ){
    let t = document.querySelector(`.miner`);
    if( on ){
        state.anim = true;
        let doing = `walking`;
        if( ( state.miner.pos.x - state.miner.old.x ) == 1 ){ doing = `falling`; }
        t.classList.add( doing );
    }
    else{
        state.anim = false;
        t.classList.remove(`walking`);
        t.classList.remove(`falling`);
    }
}

function mineTarget(){
    let o = {};
    o.x = state.miner.pos.x + state.miner.dir.x;
    o.y = state.miner.pos.y + state.miner.dir.y;
    return o;
}

function gainRes( a ){
    inventory[a]++;
    let div = document.querySelector(`[data-type=${a}]`);
    div.classList.remove(`noDisplay`);
    div.children[1].innerHTML = inventory[a];
}

function getAmount(){
    return 1;
}

function buildBoard( l, y ){
    let e = document.querySelector(`#board`);
    e.innerHTML = ``;    
    let b = document.querySelector(`body`).getBoundingClientRect();
    let x = Math.ceil( Math.ceil( b.height / 16 ) / 5 );
    state.y = y;
    state.l = l;
    board[`l${l}`] = {};
    addRows( 0, x );
    setTimeout(() => {
        bustBlock( 0, 0, false );
        moveMiner( 0, 0, true );
    }, 50);    
}

function addRows( l, n ){
    state.x += n;
    let seeds = [];
    for( let i = 0; i < n; i++ ){
        let x = state.x - n + i;
        board[`l${l}`][`x${x}`] = {};
        for( let j = 0; j < state.y; j++ ){
            board[`l${l}`][`x${x}`][`y${j}`] = {
                type: res()
                , wear: 0
                , gone: false
                , seen: false
            }
            if( board[`l${l}`][`x${x}`][`y${j}`].type !== `stone` ){
                seeds.push( { x: x, y: j } );
            }
        }
    }    
    buildVeins( seeds );
    buildBoardUI( n );
}

function buildVeins( s ){
    for( i in s ){
        let x = s[i].x, y = s[i].y;
        let t = board[`l${state.l}`][`x${x}`][`y${y}`];
        let v = types[t.type].vein;
        for( let j = 0; j < v; j++ ){
            let n = getNeighbours( x, y, false );
            let q = Math.floor( Math.random() * n.length );
            if( checkBlock( state.l, n[q].x, n[q].y ).type == `stone` ){
                board[`l${state.l}`][`x${n[q].x}`][`y${n[q].y}`].type = t.type;
            }
            else{ break; }
        }
    }
}

function buildBoardUI( n ){
    let b = document.querySelector(`#board`);
    for( let i = 0; i < n; i++ ){
        let r = document.createElement(`div`);
        r.classList.add(`row`);
        r.setAttribute(`id`,`r${state.x - n + i}`)
        for( let j = 0; j < state.y; j++ ){
            r.appendChild( makeTile( board[`l${state.l}`][`x${state.x - n + i}`][`y${j}`].type, state.x - n + i, j ) );
        }
        b.appendChild(r);
    }
}

function killRows( l, n ){
    let start = p( document.querySelector(`#board`).children[0].children[0].getAttribute(`data-x`) );
    for( let i = 0; i < n; i++ ){
        let kill = document.querySelector(`#r${start + i}`);
        kill.parentElement.removeChild( kill );
        delete board[`l${l}`][`x${start + i}`];
        document.querySelector(`#board`).style = `transition: none; transform: none`;
    }
}

function shiftField( n ){
    let rem = n * 5;
    document.querySelector(`#board`).style = `transition: transform ${state.delay}ms; transform: translateY(-${rem}rem)`;
}

function buildBar(){
    let a = document.querySelector(`#topBar`);    
    for( key in types ){
        let b = document.createElement(`div`);
        b.classList = `topBox noDisplay`;
        b.setAttribute(`data-type`,key);
        let c = document.createElement(`div`);
        c.classList = `img ${key}-l`;
        let d = document.createElement(`div`);
        d.classList = `topCount`;
        d.innerHTML = `-`;
        b.appendChild(c);
        b.appendChild(d);
        a.appendChild(b);
    }
}

function res(){
    let output = ``;
    let nonce = Math.random();
    let sc = 0;
    for( key in types ){
        sc += types[key].chance;
        if( nonce < sc ){
            output = key;
            break;
        }
    }
    return output;
}

function getNeighbours( x, y, cardinal ){
    let min = 0, xMax = state.x, yMax = state.y;
    let o = [];
    for( let m = -1; m <= 1; m++ ){
        for( let n = -1; n <= 1; n++ ){
            if( x + m >= min && x + m < xMax ){
                if( y + n >= min && y + n < yMax ){
                    if( cardinal ){
                        if( m == 0 || n == 0 ){
                            o.push( { x: x + m, y: y + n } );
                        }
                    }
                    else{
                        o.push( { x: x + m, y: y + n } );
                    }
                }
            }
        }
    }
    return o;
}

function checkBlock( l, x, y ){
    return board[`l${l}`][`x${x}`][`y${y}`];
}

function makeTile( type, x, y ){
    let o = document.createElement(`div`);
    o.classList.add( `tile` );
    o.classList.add( type );
    o.setAttribute(`data-x`, x );
    o.setAttribute(`data-y`, y );
    o.innerHTML = `<div class="tileObs"><div class="fow"></div></div>`;
    return o;
}

function minerDiv(){
    let b = document.createElement(`div`);
    b.classList = `minerCell`;
    let yChange = state.miner.pos.y - state.miner.old.y;
    let dir = `right`;
    if( yChange == 1 ){ dir = `right`}
    else if( yChange == -1 ){ dir = `left` }
    else if( yChange == 0 && state.miner.pos.y == 0 ){ dir = `right` }
    else if( yChange == 0 ){ dir = `left` }
    let o = document.createElement(`div`);
    o.classList = `miner ${dir}`;
    o.style = `left: 0rem; top: 0.75rem;`
    b.appendChild(o);
    return b;
}

function shiftInnards(){
    let m = document.querySelector(`.minerCell`);
    let shiftX = ( state.miner.pos.y - state.miner.old.y ) * -5;
    let shiftY = ( state.miner.pos.x - state.miner.old.x ) * -5;
    m.style = `transition: none;
        transform: translateX(${shiftX}rem) translateY(${shiftY}rem);`;
    setTimeout(() => {
        m.style = `transition: transform ${state.tickTime * 2 - 50}ms;
            transform: translateX(0rem) translateY(0rem);`;
    }, 50 );
}

function p( x ){
    return parseInt( x.replace(/\D/g,'') );
}


// variables

var state = {
    x: 0
    , y: 0
    , l: 0
    , target: { x: null, y: null }
    , miner: { old: {x: 0, y: 0 } }
    , tickTime: 600
    , thresh: 5
    , anim: false
    , delay: 5000
}

var board = {
    l0: {
        x0: {
            y0: {}
        }
    }
}

var types = {
    emerald: { tough: 50, chance: 0.0005, vein: 0 }
    , ruby: { tough: 30, chance: 0.0005, vein: 0 }
    , diamond: { tough: 25, chance: 0.001, vein: 0 }
    , gold: { tough: 10, chance: 0.002, vein: 1 }
    , iron: { tough: 20, chance: 0.004, vein: 3 }
    , coal: { tough: 10, chance: 0.008, vein: 5 }
    , stone: { tough: 5, chance: 1, vein: 0 }
}

var inventory = {
    stone: 0
    , coal: 0
    , iron: 0
    , gold: 0
    , ruby: 0
    , emerald: 0
    , diamond: 0
}

var pick = {

}



function splice( arr1, arr2 ){
    let newGenome = {}
    for( g in genome ){
        let dom1 = arr1.dominance[g];
        let dom2 = arr2.dominance[g];
        let stat1 = arr1.base[g];
        let stat2 = arr2.base[g];
        let domNonce = Math.floor( Math.random() * dom1 + dom2 )
        if( domNonce <= dom1 ){ newGenome[g] = stat1; }
        else{ newGenome[g] = stat2; }
    }
    return newGenome;
}