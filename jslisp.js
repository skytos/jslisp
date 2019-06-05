function Pair(a,b) {this.car=a;this.cdr=b}
cons = (a, b) => new Pair(a, b)
car = p => p.car
cdr = p => p.cdr
eq = (x, y) => x === y
pairp = p => p instanceof Pair
nullp = x => x === null
atomp = x => !nullp(x) && !pairp(x)
build = (a, b) => cons(a, cons(b, null))
first = car
second = x => car(cdr(x))
third = x => car(cdr(cdr(x)))
newEntry = build

lookupInEntry = (name, entry, entryF) =>
	lookupInEntryHelp(name, first(entry), second(entry), entryF)

lookupInEntryHelp = (name, names, vals, entryF) =>
	nullp(names) ?
		entryF(name) :
	eq(car(names), name) ?
		car(vals) :
		lookupInEntryHelp(name, cdr(names), cdr(vals), entryF)

extendTable = cons
lookupInTable = (name, table, tableF) =>
	nullp(table) ? tableF(name) :
		lookupInEntry(name, car(table), (name) =>
			lookupInTable(name, cdr(table), tableF))

atomToAction = e =>
	eq(e, "cons") ? _const :
	eq(e, "car") ? _const :
	eq(e, "cdr") ? _const :
	eq(e, "nullp") ? _const :
	eq(e, "eq") ? _const :
	eq(e, "atomp") ? _const :
		_identifier

expressionToAction = e =>
	atomp(e) ? atomToAction(e) : listToAction(e)

listToAction = e =>
	atomp(car(e)) ? (
		eq(car(e), 'quote') ? _quote :
		eq(car(e), 'lambda') ? _lambda :
		eq(car(e), 'cond') ? _cond :
		_application) :
		_application

value = e => meaning(e, null)
meaning = (e, table) =>
	expressionToAction(e)(e, table)

_const = (e, table) =>
	build('primitive', e)

_quote = (e, table) =>
	second(e)

_identifier = (e, table) =>
	lookupInTable(e, table, (e) => {throw(e+' not defined')})

_lambda = (e, table) =>
	build('non-primitive', cons(table, cdr(e)))

tableOf = first
formalsOf = second
bodyOf = third

evcon = (lines, table) =>
	meaning(questionOf(car(lines)), table) ? meaning(answerOf(car(lines)), table) :
		evcon(cdr(lines), table)
questionOf = first
answerOf = second

_cond = (e, table) =>
	evcon(condLinesOf(e), table)
condLinesOf = cdr

evlis = (args, table) =>
	nullp(args) ? null :
		cons(meaning(car(args), table), evlis(cdr(args), table))

_application = (e, table) =>
	apply(meaning(functionOf(e), table), evlis(argumentsOf(e), table))
functionOf = car
argumentsOf = cdr

primitivep = l => eq(car(l), 'primitive')
nonprimitivep = l => eq(car(l), 'non-primitive')

apply = (fun, vals) =>
	primitivep(fun) ? applyPrimitive(second(fun), vals) :
		applyClosure(second(fun), vals)

applyPrimitive = (name, vals) =>
	eq(name, 'cons') ? cons(first(vals), second(vals)) :
	eq(name, 'car') ? car(first(vals)) :
	eq(name, 'cdr') ? cdr(first(vals)) :
	eq(name, 'nullp') ? nullp(first(vals)) :
	eq(name, 'eq') ? eq(first(vals), second(vals)) :
	atomLike(first(vals))
atomLike = e =>
	atomp(e) ||
		!nullp(e) && (eq(car(e), 'primitive') || eq(car(e), 'non-primitive'))

applyClosure = (closure, vals) =>
	meaning(
		bodyOf(closure),
		extendTable(
			newEntry(formalsOf(closure), vals),
			tableOf(closure)))


tos = i => pairp(i) ? "(" + tosl(i) + ")" : i
tosl = (l, s) => l == null ? "" : 
	(s ? " " : "") + tos(car(l)) + tosl(cdr(l), true)
list = (...a) => a.length ? 
	cons(a[0], list(...a.slice(1))) : null

pi = ts => {
	if (!pairp(ts)) return
	let t = car(ts)
	if (t == '[') {
		return pl(cdr(ts))
	} else if (t == ']') {
		throw "unmatched ]"
	} else if (t == "'") {
		let r = pi(cdr(ts))
		return [list('quote', r[0]), r[1]]
	} else {
		return [t, cdr(ts)]
	}
}
pl = ts => {
	if (!pairp(ts)) throw("unmatched [")
	let t = car(ts)
	if (t == '[') {
		let r1 = pl(cdr(ts))
		let r2 = pl(r1[1])
		return [cons(r1[0], r2[0]), r2[1]]
	} else if (t == ']') {
		return [null, cdr(ts)]
	} else if (t == "'") {
		let r1 = pi(cdr(ts))
		let r2 = pl(r1[1])
		return [cons(list('quote', r1[0]), r2[0]), r2[1]]
	} else {
		let r = pl(cdr(ts))
		return [cons(t, r[0]), r[1]]
	}
}

tokenize = str =>
	list(...str.
		replace(/\[/g, " [ ").
		replace(/\]/g, " ] ").
		replace(/\'/g, " ' ").
		trim().
		split(/\s+/))

tp = str => pi(tokenize(str))[0]
