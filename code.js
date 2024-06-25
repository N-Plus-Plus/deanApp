window.addEventListener("mousedown", function (e) { clicked( e ); } );
window.addEventListener("touchstart", function (e) { clicked(e); });
document.addEventListener(`DOMContentLoaded`, function () { onLoad(); } );

function onLoad(){
    // buildModal(`firstLaunch`);
    // toggleModal();
    loadData();
    updateDisplay();
}

function clicked( e ){
    let f = e.target.getAttribute( "data-function" );
    if( f == `toggleModal` ){ toggleModal(); }
    if( f == `addSalary` ){ buildModal( `addSalary` ); toggleModal(); }
    if( f == `addIncome` ){ addIncome( document.getElementById("addSalary").value, document.getElementById("incomeTitle").value ); }
    if( f == `transferFunds` ){ buildModal( `transferFunds` ); toggleModal(); temp.from = e.target.getAttribute( `data-discriminator` ); }
    if( f == `executeFundsTransfer` ){ transfer( temp.from, temp.to, !document.getElementById(`topUpOrNot`).checked, document.getElementById(`transferAmt`).value ); }
    if( f == `addExpense` ){ buildModal( `addExpense` ); toggleModal(); }
    if( f == `executeExpense` ){ addExpense( temp.from, document.getElementById(`expenseAmount`).value ); }
    if( f == `addEnvelope` ){ buildModal( `addEnvelope` ); toggleModal(); }
    if( f == `executeAddEnvelope` ){ addEnvelope( document.getElementById(`envName`).value ); }
    if( f == `envelopes` ){ buildModal( `envelopes` ); toggleModal(); }
    if( f == `hide` ){ hideEnv( e.target ); }
    if( f == `unhide` ){ unhideEnv( e.target ); }
    if( f == `saveEnvelopes` ){ saveEnvelopes(); }
    if( f == `endMonth` ){ buildModal( `endMonth` ); toggleModal(); }
    if( f == `endCurrentMonth` ){ endCurrentMonth(); }
    console.log( f )
}

var fund = {
    past: 0,
    income: 0,
    incomeDeets: [],
    spent: 0
}

var env = {
    envelope0: {
        display: `Unallocated`
        , starting: 0
        , added: 0
        , spent: 0
        , active: true
    }
}

var temp = { from: `envelope0`, to: `envelope0` }

function updateFrom(){ temp.from = document.getElementById(`fromEnv`).value; }
function updateTo(){ temp.to = document.getElementById(`toEnv`).value; }

function addEnvelope( name ){
    env[`envelope` + Object.keys( env ).length] = {
        display: name
        , starting: 0
        , added: 0
        , spent: 0
        , active: true
    }
    updateDisplay();
    closeModal();
}

function addIncome( amt, title ){
    amt = parseFloat( amt.replace(/[^0-9.]/g, '') );
    fund.incomeDeets.push( { amt: amt, title: title } );
    env.envelope0.added += amt;
    updateDisplay();
    closeModal();
}

function transfer( fromId, toId, aggregate, amt ){
    amt = parseFloat( amt.replace(/[^0-9.]/g, '') );
    if( envelopeBalance( fromId ) >= amt ){
        if( aggregate ){
            env[fromId].added -= amt;
            env[toId].added += amt;
        }
        else{
            let float = amt - envelopeFundBalance( toId );
            env[fromId].added -= float;
            env[toId].added += float;
        }
    }
    updateDisplay();
    closeModal();
}

function addExpense( envId, amt ){
    console.log( envId, amt );
    amt = parseFloat( amt.replace(/[^0-9.]/g, '') );
    env[envId].spent += amt;
    fund.spent += amt;
    updateDisplay();
    closeModal();
}

function envelopeBalance( envId ){
    return env[envId].starting + env[envId].added - env[envId].spent;
}

function envelopeFundBalance( envId ){
    return env[envId].starting + env[envId].added;
}

function toggleModal(){
    let t = document.getElementById("modalShade");
    if( t.classList.contains( `noDisplay` ) ){ t.classList.remove( `noDisplay` ) }
    else{ t.classList.add( `noDisplay` ); }
}

function closeModal(){ document.getElementById("modalShade").classList.add( `noDisplay` ); }

function updateDisplay(){
    saveData();
    updateTopBar();
    updateEnvelopes();
    updateIncomes();
}

function updateTopBar(){
    let t = document.getElementById(`topBalance`);
    let budget = 0;
    for( let i = 0; i < fund.incomeDeets.length; i++ ){ budget += fund.incomeDeets[i].amt; }
    let spent = 0;
    for( const key in env ){ spent += env[key].spent; }
    t.children[0].innerHTML = niceNumber( budget );
    t.children[1].innerHTML = niceNumber( spent );
    t.children[2].innerHTML = niceNumber( budget - spent );
}

function updateEnvelopes(){
    let t = document.getElementById("envelopeBody");
    t.innerHTML = `<div class="middleLabel envLabel">Envelopes</div>
        <div class="row">
            <div class="title"></div>
            <div class="rowSegment title1"><b>Budget</b></div>
            <div class="rowSegment title1"><b>Spent</b></div>
            <div class="rowSegment title1"><b>Balance</b></div>
            <div class="void"></div>
        </div>`;
    for( let i = 0; i < Object.keys( env ).length; i++ ){
        if( env[`envelope${i}`].active ){
            let available = env[`envelope${i}`].starting + env[`envelope${i}`].added;
            let consumed = env[`envelope${i}`].spent;
            t.innerHTML += `
                <div class="row">
                    <div class="title">${env[`envelope${i}`].display}</div>
                    <div class="rowSegment green">${ niceNumber( available ) }</div>
                    <div class="rowSegment red">${ niceNumber( consumed ) }</div>
                    <div class="rowSegment white">${ niceNumber( available - consumed ) }</div>
                    <div class="transfer" data-function="transferFunds" data-discriminator="${`envelope${i}`}"></div>
                </div>
                <div class="progress">
                    <div class="spent" style="width: ${ Math.min( 100, consumed / available * 100 ) }%;"></div>
                    <div class="overspend" style="width: ${ Math.max( 0, (
                        ( consumed - available ) / consumed
                    ) ) * 100 }%;"></div>
                </div>`
        }
    }
    t.innerHTML += `
        <div class="row">
            <div class="add" data-function="addEnvelope"></div>
        </div>
    `
}

function updateIncomes(){
    let t = document.getElementById(`incomeBody`);
    t.innerHTML = `<div class="middleLabel">Income</div>`
    for( let i = 0; i < fund.incomeDeets.length; i++ ){
        t.innerHTML += `
        <div class="incomeRow">
            <div class="incomeLabel">${fund.incomeDeets[i].title}</div>
            <div class="incomeLabel rightAlign green">${niceNumber(fund.incomeDeets[i].amt)}</div>
        </div>
        `
    }
}

function saveEnvelopes(){
    let t = document.getElementById(`envelopesDisp`);
    for( let i = 1; i <= t.children.length; i++ ){
        env[`envelope` + i ].display = t.children[i - 1].children[0].value;
        let a = t.children[ i - 1].children[1].classList == `hide`;
        if( env[`envelope` + i ].active !== a ){
            if( env[`envelope` + i ].active ){ deactivate( `envelope` + i ); }
            else{ activate( `envelope` + i ); }
        }
    }
    closeModal();
    updateDisplay();
}

function activate( e ){
    env[e].active = true;
    console.log(`activate`)
}

function deactivate( e ){
    env[e].active = false;
    env.envelope0.spent += env[e].spent;
    env[e].spent = 0;
    env.envelope0.added += env[e].starting + env[e].added;
    env[e].starting = 0;
    env[e].added = 0;
}

function endCurrentMonth(){
    let roll = 0;
    for( const key in env ){
        if( env.hasOwnProperty(key) ){
            if( key !== `envelope0` ){
                let bal = envelopeBalance( key );
                env[key].spent = 0;
                env[key].added = 0;
                env[key].starting = bal;
                roll += bal;
            }
        }
    }
    roll += envelopeBalance( `envelope0` );
    fund.incomeDeets = [ { amt: roll, title: `Rolled Over` } ];
    closeModal();
    updateDisplay();
}

function buildModal( content ){
    let t = document.getElementById(`modal`);
    if( content == `addSalary` ){
        t.innerHTML = `
            <div class="closeModal" data-function="toggleModal"></div>
            Enter the source and amount of the new Income into the boxes below.</p>
            It will be automatically added to Unallocated for this month (you can move it to envelopes).</p>
            <div class="vertBox">
                <div class="modalLabel">Source</div>
                <input class="hundo" type="text" name="text-field" id="incomeTitle" value="" data-type="title" placeholder="Deano">
            </div>
            <div class="inputGroup">
                <div class="vertBox">
                    <div class="modalLabel">Amount</div>
                    <input class="hundo" type="text" name="currency-field" id="addSalary" value="" data-type="currency" placeholder="$1,123.58">
                </div>
                <div class="button textButton" data-function="addIncome">Commit</div>
            </div>
        `
    }
    else if( content == `transferFunds` ){
        t.innerHTML = `
            <div class="closeModal" data-function="toggleModal"></div>
            This is where you can move money between envelopes.</p>
            You can either just move a specific amount of dollars from one envelope to another, or move however many dollars it takes to "top up" to a new balance you set.</p>
            Pro tip - You can "top up" to a figure that's bigger or smaller than the current balance of the Envelope!</p>
            <div class="inputGroup">
                <div class="label">Top up?</div>
                <label class="switch">
                    <input type="checkbox" id="topUpOrNot">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="inputGroup">
                <div class="vertBox">
                    <div class="modalLabel">From Envelope</div>
                    <select id="fromEnv" onchange="updateFrom()"></select>
                </div>
                <div class="vertBox">
                    <div class="modalLabel">To Envelope</div>
                    <select id="toEnv" onchange="updateTo()"></select>
                </div>
            </div>
            <div class="inputGroup">
                <input type="text" name="currency-field" id="transferAmt" value="" data-type="currency" placeholder="$1,123.58">
                <div class="button textButton" data-function="executeFundsTransfer">Transfer</div>
            </div>
        `
        setTimeout(() => { updateDropDowns(); }, 0 );
    }
    else if( content == `addExpense` ){
        t.innerHTML = `
        <div class="closeModal" data-function="toggleModal"></div>
            Add an expense by choosing which envelope it should come out of and specifying how much it was.</p>
            <div class="inputGroup">
                <div class="vertBox">
                    <div class="modalLabel">From Envelope</div>
                    <select id="fromEnv" onchange="updateFrom()"></select>
                </div>
            </div>
            <div class="inputGroup">
                <input type="text" name="currency-field" id="expenseAmount" value="" data-type="currency" placeholder="$1,123.58">
                <div class="button textButton" data-function="executeExpense">Spend</div>
            </div>
        </div>
        `
        setTimeout(() => { updateDropDowns(); }, 0 );
    }
    else if( content == `addEnvelope` ){
        t.innerHTML = `
        <div class="closeModal" data-function="toggleModal"></div>
            Give your new Envelope a name below.</p>
            This Envelope will start with a balance of $0, but you can transfer into it as soon as it's created.</p>
            <div class="inputGroup">
                <input type="text" name="text-field" id="envName" value="" data-type="text" placeholder="Drugs">
                <div class="button textButton" data-function="executeAddEnvelope">Create</div>
            </div>
        </div>
        `
    }
    else if( content == `envelopes` ){
        t.innerHTML = `
        <div class="closeModal" data-function="toggleModal"></div>
            Manage your envelopes here.</p>
            <div class="envelopesDisp" id="envelopesDisp"></div>
            <div class="inputGroup">
                <div class="button textButton" data-function="saveEnvelopes">Save</div>
            </div>
        </div>
        `
        setTimeout(() => { populateEnvelopes(); }, 0);
    }
    else if( content == `endMonth` ){
        t.innerHTML = `
        <div class="closeModal" data-function="toggleModal"></div>
            You're about to end the current month.</p>
            This can't be undone - are you sure?</p>
            <div class="inputGroup">
                <div class="button textButton" data-function="endCurrentMonth">Yep!</div>
            </div>
        </div>
        `
    }
}

function populateEnvelopes(){
    let t = document.getElementById( `envelopesDisp` );
    for( const key in env ){
        if( env.hasOwnProperty(key) ){
            if( key !== `envelope0` ){
                const row = document.createElement('div');
                let h = env[key].active ? "hide" : "unhide";
                row.classList = `envRow`;
                row.setAttribute( `value-env`, key );
                row.innerHTML = `
                    <input class="envInput" type="text" id="${key}" name="${key}" value="${env[key].display}">
                    <div data-function="${ h }" class="${ h }"></div>
                `
                t.appendChild(row);
            }
        }
    }
}

function hideEnv( t ){
    t.setAttribute( `data-function`, `unhide` );
    t.classList = `unhide`;
}

function unhideEnv( t ){
    t.setAttribute( `data-function`, `hide` );
    t.classList = `hide`;
}

function updateDropDowns(){
    let t = document.getElementById( `fromEnv` );
    for( const key in env ){
        if( env.hasOwnProperty(key) ){
            const option = document.createElement('option');
            option.value = key;
            option.text = env[key].display;
            t.appendChild(option);
        }
    }
    t = document.getElementById( `toEnv` );
    if( t !== null ){
        for( const key in env ){
            if( env.hasOwnProperty(key) ){
                const option = document.createElement('option');
                option.value = key;
                option.text = env[key].display;
                t.appendChild( option );
            }
        }
    }
    if( temp.from !== null ){
        document.getElementById( `fromEnv` ).value = temp.from;
    }
}

function niceNumber( amt ){
    let isNegative = amt < 0;
    const absoluteAmt = Math.abs(amt).toFixed(2); // Ensure two decimal places
    if (parseFloat( absoluteAmt ) == 0) {
        isNegative = false;
    }
    // Split the amount into dollars and cents
    const parts = absoluteAmt.split('.');
    // Format the dollars part with commas
    parts[0] = parts[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // Join the parts back together
    const formattedAmt = parts.join('.');
    return (isNegative ? "-$" : "$") + formattedAmt;
}

function saveData() {
    const data = {
        fund: fund,
        env: env
    };
    localStorage.setItem('financeData', JSON.stringify(data));
}

function loadData() {
    const data = localStorage.getItem('financeData');
    if (data) {
        const parsedData = JSON.parse(data);
        fund = parsedData.fund;
        env = parsedData.env;
    }
}


/*
<div class="modal">This will end the current month and roll your envelope balances forward to a fresh month.<p>Are you sure you want to do this?
    <div class="buttonBox">
        <div class="button" data-button="closeModal">Whoops!</div>
        <div class="button" data-button="newMonth">Yep!</div>
    </div>
</div>
*/


/*

Set Long Term Savings ?

Add Income modal - Throws the balance into Savings for that Month

Transfer Balance modal - Moves money between envelopes
- Shortcut to create new envelope directly from this screen with a starting balance?
- Option to either "top up to" or "add funds to"

Manage Envelopes modal - Close an Envelope (what do with balance ?)
- Other method to add a new envelope with zero balance

End Month logic - roll over balance to new month of everything but savings
Take the residual savings and put them into long term then zero savings ready for new income

Save and Load
- On Load, if nothing to load, modal asking for the balance to start outside of monthly savings

Dollars only, or cents too?

Can you tranfer balance leaving you with negative?
Cents Matter


Pie chart that shows spending per envelope per month over time

Individual expenses is useful

cannot spend out of unallocated

*/