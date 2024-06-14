window.addEventListener("mousedown", function (e) { clicked( e ); } );

function clicked( e ){
    let f = e.target.getAttribute( "data-function" );
    if( f == `toggleModal` ){ toggleModal(); }
    if( f == `commitStartFunds` ){ commitStartFunds( document.getElementById("startFunds").value  ); }
    if( f == `addSalary` ){ buildModal( `addSalary` ); toggleModal(); }
    if( f == `addIncome` ){ addIncome( document.getElementById("addSalary").value ); }
    if( f == `transferFunds` ){ buildModal( `transferFunds` ); toggleModal(); temp.from = e.target.getAttribute( `data-discriminator` ); }
    if( f == `executeFundsTransfer` ){ transfer( temp.from, temp.to, !document.getElementById(`topUpOrNot`).checked, document.getElementById(`transferAmt`).value ); }
    if( f == `addExpense` ){ buildModal( `addExpense` ); toggleModal(); }
    if( f == `executeExpense` ){ addExpense( temp.from, document.getElementById(`expenseAmount`).value ); }
    if( f == `addEnvelope` ){ buildModal( `addEnvelope` ); toggleModal(); }
    if( f == `executeAddEnvelope` ){ addEnvelope( document.getElementById(`envName`).value ); }
    console.log( f )
}

var fund = {
    past: 59250,
    income: 0,
    spent: 0
}

var env = {
    envelope0: {
        display: `Savings`
        , starting: 0
        , added: 0
        , spent: 0
        , active: true
    }
}

var temp = { from: `envelope0`, to: `envelope0` }

function updateFrom(){ temp.from = document.getElementById(`fromEnv`).value; }
function updateTo(){ temp.to = document.getElementById(`toEnv`).value; }

function commitStartFunds( x ){
    fund.past = x;
    updateDisplay();
    closeModal();
}

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

function addIncome( amt ){
    amt = parseInt( amt );
    fund.income += amt;
    env.envelope0.added += amt;
    updateDisplay();
    closeModal();
}

function transfer( fromId, toId, aggregate, amt ){
    amt = parseInt( amt );
    if( envelopeBalance( fromId ) >= amt ){
        if( aggregate ){
            env[fromId].added -= amt;
            env[toId].added += amt;
        }
        else{
            let float = amt - envelopeBalance( toId );
            env[fromId].added -= float;
            env[toId].added += float;
        }
    }
    updateDisplay();
    closeModal();
}

function addExpense( envId, amt ){
    console.log( envId, amt );
    amt = parseInt( amt );
    env[envId].spent += amt;
    fund.spent += amt;
    updateDisplay();
    closeModal();
}

function envelopeBalance( envId ){
    return env[envId].starting + env[envId].added - env[envId].spent;
}

function toggleModal(){
    let t = document.getElementById("modalShade");
    if( t.classList.contains( `noDisplay` ) ){ t.classList.remove( `noDisplay` ) }
    else{ t.classList.add( `noDisplay` ); }
}

function closeModal(){ document.getElementById("modalShade").classList.add( `noDisplay` ); }

function updateDisplay(){
    updateTopBar();
    updateEnvelopes();
}

function updateTopBar(){
    let t = document.getElementById(`topBalance`);
    t.children[0].innerHTML = niceNumber( fund.past );
    t.children[1].innerHTML = niceNumber( fund.income );
    t.children[2].innerHTML = niceNumber( fund.spent );
    t.children[3].innerHTML = niceNumber( fund.income - fund.spent );
}

function updateEnvelopes(){
    let t = document.getElementById("envelopeBody");
    t.innerHTML = `<div class="row">
        <div class="title1"><b>Envelope</b></div>
        <div class="segment title1"><b>Funds</b></div>
        <div class="segment title1"><b>Spent</b></div>
        <div class="segment title1"><b>Balance</b></div>
        <div class="void"></div>
        <div class="void"></div>
    </div>`;
    for( let i = 0; i < Object.keys( env ).length; i++ ){
        if( env[`envelope${i}`].active ){
            let available = env[`envelope${i}`].starting + env[`envelope${i}`].added;
            let consumed = env[`envelope${i}`].spent;
            t.innerHTML += `
                <div class="row">
                    <div class="title">${env[`envelope${i}`].display}</div>
                    <div class="segment green">${ niceNumber( available ) }</div>
                    <div class="segment red">${ niceNumber( consumed ) }</div>
                    <div class="segment white">${ niceNumber( available - consumed ) }</div>
                    <div class="void"></div>
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

function buildModal( content ){
    let t = document.getElementById(`modal`);
    if( content == `firstLaunch` ){
        t.innerHTML = `
            <div class="closeModal" data-function="toggleModal"></div>
            Hey there!<p>
            Because this is the first time you're launching this web app, before we get to salary and expenses, please enter the amount of past savings below.<p>
            This number should be all of your money that, before the start of this month, has been put away: This app will update this figure as you end months going forward.<p>
            Oh, and this web app works in whole dollars, so there may be a slight drift from your bank balance by a few dollars over time ... but it'll be close enough.<p>
            <div class="inputGroup">
                <input type="text" name="currency-field" id="startFunds" pattern="^\$\d{1,3}(,\d{3})*(\.\d+)?$" value="" data-type="currency" placeholder="1,000,000">
                <div class="button textButton" data-function="commitStartFunds">Commit</div>
            </div>
        `
    }
    else if( content == `addSalary` ){
        t.innerHTML = `
            <div class="closeModal" data-function="toggleModal"></div>
            Enter the new Salary into the box below.</p>
            It will be automatically added to Savings for this month (you can move it from there to other envelopes as you see fit).</p>
            Pro tip - you can enter a negative number to make money disappear, in case you made an error, or because some money actually disappeared!</p>
            <div class="inputGroup">
                <input type="text" name="currency-field" id="addSalary" pattern="^\$\d{1,3}(,\d{3})*(\.\d+)?$" value="" data-type="currency" placeholder="1,000,000">
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
                <input type="text" name="currency-field" id="transferAmt" pattern="^\$\d{1,3}(,\d{3})*(\.\d+)?$" value="" data-type="currency" placeholder="1,000,000">
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
                <input type="text" name="currency-field" id="expenseAmount" pattern="^\$\d{1,3}(,\d{3})*(\.\d+)?$" value="" data-type="currency" placeholder="1,000,000">
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
    const absoluteAmt = Math.abs(Math.round(amt));
    if( absoluteAmt == 0 ){ isNegative = false; }
    const formattedAmt = absoluteAmt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (isNegative ? "-$" : "$") + formattedAmt;
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

*/