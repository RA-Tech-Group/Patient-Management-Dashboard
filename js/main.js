var checkUnique = function(arr) {
	var hash = {}, result = []
	for (let i = 0, l = arr.length; i < l; ++i) {
		if (!hash.hasOwnProperty(arr[i])) {
			hash[ arr[i] ] = true
			result.push(arr[i])
		}
	}
	return result
}

var getCounts = function(arr) {
	var i = arr.length, obj = {}
	while (i) obj[arr[--i]] = (obj[arr[i]] || 0) + 1
	return obj
}

var getCount = function(word, arr) {
	return getCounts(arr)[word] || 0
}

// sort json array by key
var sortByKey = function(array, key) {
	return array.sort(function(a, b) {
		var x = a[key]
		var y = b[key]
		return ((x < y) ? -1 : ((x > y) ? 1 : 0))
	})
}

var getRooms = function(data) {
	let tempRooms = [], rooms = []
	
	let opnumber = 0
	let eventCode = ''
	const roomSep = ['INPR', 'INAN', 'INTH', 'RECA', 'REC1', 'REC2']
	
	for (let i in data) {
		if (opnumber !== data[i].OPNumber) {
			opnumber = data[i].OPNumber
	
			tempRooms[opnumber] = {
				INPR: [], // 'INPR'
				INAN: [], // 'INAN'
				INTH: [],	// 'INTH'
				RECA: [], // 'RECA'
				REC1: [], // 'REC1'
				REC2: [] // 'REC2'
			}

			eventCode = ''
		}

		if (roomSep.includes(data[i].EVENTCODE)) {
			eventCode = data[i].EVENTCODE
		}

		if (eventCode !== '') {
			tempRooms[opnumber][eventCode].push(data[i])
		}
	}

	for (let i in tempRooms) {
		rooms[i] = []

		for (let j in roomSep) {
			if (tempRooms[i][roomSep[j]].length != 0) {
				rooms[i].push({roomCode: roomSep[j], events: tempRooms[i][roomSep[j]]})
			}
		}
	}
	
	return rooms
}

var groupName = {
	Main: 'Main Theatres',
	DSU: 'Day Surgery Theatres',
	Manfield: 'Mansfield Theatres',
	Gynae: 'Gynae Theatres',
	Eyes: 'Eye Theatres',
	Sturtridge: 'Sturtridge Theatres',
	Endo: 'Endo Proc Theatres'
}

var filterValue = ['All']

var margin = {
	top: 40,
	right: 40,
	bottom: 20,
	left: 40
}

var dashboard = function() {
	d3.csv("/csv/operations.csv", function(operations) {
		d3.csv("/csv/events.csv", function(events) {
			var barHeight = 20
			var gap = barHeight + 4
			var topPadding = 60
			var sidePadding = 75

			operations = sortByKey(operations, 'USAGE')

			let rooms = getRooms(events)

			var tempRooms = [], tempOperations = []

			for (let i in operations) {
				if (typeof rooms[operations[i].OPNUMBER] !== 'undefined' && rooms[operations[i].OPNUMBER].length != 0) {
					for (let j in rooms[operations[i].OPNUMBER]) {
						var room = rooms[operations[i].OPNUMBER][j]

						room.opNumber = operations[i].OPNUMBER
						room.usage = operations[i].USAGE

						tempRooms.push(room)
					}

					tempOperations.push(operations[i])
				}
			}

			var allrooms = tempRooms
			var alloperations = tempOperations
			var alloperationusages = []

			for (let i = 0; i < alloperations.length; i++) {
				alloperationusages.push(alloperations[i].USAGE)
			}

			alloperationusages = checkUnique(alloperationusages)

			var keysOfGroupName = Object.keys(groupName)
			var group = []

			for (let i in alloperationusages) {
				for (let j in keysOfGroupName) {
					if (alloperationusages[i].indexOf(keysOfGroupName[j]) !== -1) {
						group.push(keysOfGroupName[j])
						break
					}
				}
			}

			uniqueGroup = checkUnique(group)
			groupUnfiltered = group

			var numOccurances = []

			for (let i = 0; i < uniqueGroup.length; i++) {
				numOccurances[i] = [uniqueGroup[i], getCount(uniqueGroup[i], groupUnfiltered)]
			}

			group = []
			var currentKey = 0

			for (let i in numOccurances) {
				group[parseInt(currentKey) + parseInt(i)] = {groupTitle: groupName[numOccurances[i][0]]}

				for (let j = currentKey; j < currentKey + numOccurances[i][1]; j++) {
					group[parseInt(j) + parseInt(i) + 1] = {usage: alloperationusages[j]}
				}

				currentKey += numOccurances[i][1]
			}

			/******************** draw filter box ********************/
			var filterboxHtml = "<option value=\"All\" " + ((filterValue != null && filterValue.includes("All")) ? 'selected' : '') + ">All</option><optgroup>"

			for (let i in group) {
				if (typeof group[i].groupTitle !== 'undefined') {
					filterboxHtml += '</optgroup><optgroup label="' + group[i].groupTitle + '">'
				} else {
					var selected = (filterValue != null && filterValue.includes(group[i].usage)) ? 'selected' : ''
					filterboxHtml += '<option value="' + group[i].usage + '" ' + selected + '>' + group[i].usage + '</option>'
				}
			}
			
			filterboxHtml += '</optgroup>'
			filterboxHtml = filterboxHtml.replace("<optgroup></optgroup>", "")
			$(".group-filter").html(filterboxHtml)
			/*********************************************************/

			function process() {
				if (filterValue != null) {
					if (filterValue.includes('All')) {
						rooms = allrooms
						operations = alloperations
					} else {
						rooms = [], operations = []

						for (let i in allrooms) {
							if (filterValue.includes(allrooms[i].usage)) {
								rooms.push(allrooms[i])
							}
						}

						for (let i in alloperations) {
							if (filterValue.includes(alloperations[i].USAGE)) {
								operations.push(alloperations[i])
							}
						}
					}
				} else {
					rooms = operations = []
				}

				tempOperations = operations
				tempRooms = rooms

				var operationusages = []
				var roomusages = []

				for (let i = 0; i < operations.length; i++) {
					operationusages.push(operations[i].USAGE)
				}

				for (let i = 0; i < rooms.length; i++) {
					roomusages.push(rooms[i].usage)
				}

				var operationusagesUnfiltered = operationusages
				var roomusagesUnfiltered = roomusages

				operationusages = checkUnique(operationusages)
				roomusages = checkUnique(roomusages)

				/******************************************************** subGrouping *********************************************************/
				var subGroupedOperations = [], subGroupedRooms = []

				for (let i in operations) {
					if (typeof subGroupedOperations[operations[i].USAGE] !== 'undefined') {
						subGroupedOperations[operations[i].USAGE].push(operations[i])
					} else {
						subGroupedOperations[operations[i].USAGE] = [{subGroupTitle: operations[i].USAGE, USAGE: operations[i].USAGE}]
						subGroupedOperations[operations[i].USAGE].push(operations[i])
					}
				}

				for (let i in rooms) {
					if (typeof subGroupedRooms[rooms[i].usage] !== 'undefined') {
						subGroupedRooms[rooms[i].usage].push(rooms[i])
					} else {
						subGroupedRooms[rooms[i].usage] = [{subGroupTitle: rooms[i].usage, usage: rooms[i].usage, opNumber: -1}]
						subGroupedRooms[rooms[i].usage].push(rooms[i])
					}
				}
				/*********************************************************************************************************************************************/

				/*************************************************************** grouping ********************************************************************/
				var groupedOperations = [], groupedRooms = []

				for (let key in subGroupedOperations) {
					for (let j in keysOfGroupName) {
						if (key.indexOf(keysOfGroupName[j]) !== -1) {
							if (typeof groupedOperations[keysOfGroupName[j]] !== 'undefined') {
								for (let i in subGroupedOperations[key]) {
									groupedOperations[keysOfGroupName[j]].push(subGroupedOperations[key][i])
								}
							} else {
								groupedOperations[keysOfGroupName[j]] = [{groupTitle: groupName[keysOfGroupName[j]]}]

								for (let i in subGroupedOperations[key]) {
									groupedOperations[keysOfGroupName[j]].push(subGroupedOperations[key][i])
								}
							}
							break
						}
					}
				}

				for (let key in subGroupedRooms) {
					for (let j in keysOfGroupName) {
						if (key.indexOf(keysOfGroupName[j]) !== -1) {
							if (typeof groupedRooms[keysOfGroupName[j]] !== 'undefined') {
								for (let i in subGroupedRooms[key]) {
									groupedRooms[keysOfGroupName[j]].push(subGroupedRooms[key][i])
								}
							} else {
								groupedRooms[keysOfGroupName[j]] = [{groupTitle: groupName[keysOfGroupName[j]], opNumber: 1}]

								for (let i in subGroupedRooms[key]) {
									groupedRooms[keysOfGroupName[j]].push(subGroupedRooms[key][i])
								}
							}
							break
						}
					}
				}
				/*********************************************************************************************************************************************/
				operations = []

				for (let i in groupedOperations) {
					for (let j in groupedOperations[i]) {
						operations.push(groupedOperations[i][j])
					}
				}
				
				rooms = []

				for (let i in groupedRooms) {
					for (let j in groupedRooms[i]) {
						rooms.push(groupedRooms[i][j])
					}
				}
				/*********************************************************************************************************************************************/
				var w = document.body.clientWidth - margin.left - margin.right
				var h = (operations.length) * gap + topPadding * 2 + 60

				var today = new Date()

				var timeDomainStart = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 08:00:00")
				var timeDomainEnd = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 17:59:59")
				var timeDomainStart2 = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 00:00:00")
				var timeDomainEnd2 = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 23:59:59")
				var x = d3.time.scale().domain([timeDomainStart, timeDomainEnd]).range([0, w - sidePadding]).clamp(true)
				var x2 = d3.time.scale().domain([timeDomainStart2, timeDomainEnd2]).range([0, w - sidePadding]).clamp(true)

				d3.select("svg").remove()

				var svg = d3.selectAll(".svg")
										.append("svg")
										.attr("width", w)
										.attr("height", h)

				/********************************************************************************************************************************************/

				/****************************************************************** vertlabels **************************************************************/
				var axisText = svg.append("g")
													.selectAll("text")
													.data(operations)
													.enter()
													.append("text")
													.text(function(d) {
														if (typeof d['groupTitle'] !== 'undefined') {
															return d['groupTitle']
														} else if (typeof d['subGroupTitle'] !== 'undefined') {
															return d['subGroupTitle']
														} else {
															return d['Patient_Name']
														}
													})
													.attr("x", function(d) {
														if (typeof d['groupTitle'] !== 'undefined') {
															return 4
														} else if (typeof d['subGroupTitle'] !== 'undefined') {
															return 4
														} else {
															return 12
														}
													})
													.attr("y", function(d, i) {
														return i * gap + topPadding + 72
													})
													.attr("font-size", function(d) {
														if (typeof d['groupTitle'] !== 'undefined') {
															return 12
														} else if (typeof d['subGroupTitle'] !== 'undefined') {
															return 11
														} else {
															return 10
														}
													})
													.attr("text-anchor", "start")
													.attr("text-height", 14)
													.attr("font-weight", function(d) {
														if (typeof d['groupTitle'] !== 'undefined') {
															return "bold"
														}
													})
				/************************************************************************************************************************************************/

				/********************************************************************** make grids **************************************************************/
				var xAxisBottom = d3.svg.axis()
														.scale(x)
														.orient('bottom')
														.tickSize(-h + topPadding + 60, 0, 0)
														.tickFormat(d3.time.format('%H:%M'))

				var xAxisTop = d3.svg.axis()
												.scale(x)
												.orient('top')
												.tickSize(0, 0, 0)
												.tickFormat(d3.time.format('%H:%M'))
				
				svg.append('g')
					.attr('class', 'grid bottom')
					.attr('transform', 'translate(' + sidePadding + ', ' + (h - 30) + ')')
					.call(xAxisBottom)
					.selectAll("text")
					.style("text-anchor", "middle")
					.attr("fill", "#000")
					.attr("stroke", "none")
					.attr("font-size", 10)
					.attr("dy", "1em")

				svg.append('g')
					.attr('class', 'grid top')
					.attr('transform', 'translate(' + sidePadding + ', ' + (topPadding + 18) + ')')
					.call(xAxisTop)
					.selectAll("text")
					.style("text-anchor", "middle")
					.attr("fill", "#000")
					.attr("stroke", "none")
					.attr("font-size", 10)
					.attr("dy", "1em")

				/*********************************************************************************************************************************************/

				/*************************************************************** Draw Rects *****************************************************************/
				var bigRect = svg.append("g")
												.append("rect")
												.attr("x", 0)
												.attr("y", function(d) {
													return topPadding + 58
												})
												.attr("width", function(d) {
													return w
												})
												.attr("height", function(d) {
													return gap * (operations.length)
												})
												.attr("stroke", "#000")
												.attr("fill", "none")

				// group split line
				var groupSplits = svg.append("g")
														.selectAll("line")
														.data(operations).enter()
														.append("line")
														.attr("x1", 0)
														.attr("x2", w)
														.attr("y1", function(d, i) {
															return i * gap + topPadding + 58
														})
														.attr("y2", function(d, i) {
															return i * gap + topPadding + 58
														})
														.attr("stroke", function(d, i) {
															if (typeof d['groupTitle'] !== 'undefined') {
																return "#000"
															} else if (typeof d['subGroupTitle'] !== 'undefined') {
																if (typeof operations[i - 1]['OPNUMBER'] !== 'undefined') {
																	return "#D3D3D3"
																}
															} else {
																return "transparent"
															}
														})
														.attr("stroke-width", "1")

				var rectOperations = svg.append("g").attr("class", "operations")

				var rectOperation = rectOperations.selectAll("rect")
																					.data(operations)
																					.enter()
																					.append("rect")
																					.attr("rx", 3)
																					.attr("ry", 3)
																					.attr("x", function(d) {
																						if (typeof d.STARTTIME !== 'undefined') {
																							var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
																							return x(barStartTime) + sidePadding
																						} else {
																							return 0
																						}
																					})
																					.attr("y", function(d, i) {
																						return i * gap + topPadding + 60
																					})
																					.attr("width", function(d) {
																						if (typeof d.STARTTIME !== 'undefined') {
																							var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
																							var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.ENDTIME)
																							return x(barEndTime) - x(barStartTime)
																						} else {
																							return 0
																						}
																					})
																					.attr("height", barHeight)
																					.attr("stroke", "none")
																					.attr("fill", "red")
																					.attr("opacity", 0.1)

				var output = document.getElementById("tooltip")

				rectOperation.on('mouseover', function(d) {
					var	tooltip = '<p>Consultant Name: ' + d.CONSULTANT + '</p><br>' + 
												'<p>Consultant Specialty: ' + d.speciality + '</p><br>' + 
												'<p>Description: ' + d.Description + '</p><br>' + 
												'<p>Estimated Time: ' + d.ESTTIME + '</p><br>'

					output.innerHTML = tooltip
					output.style.display = "block"
					output.classList.add("operation-tooltip")
				})
				.on('mousemove', function(d) {
					output.style.top = (d3.event.layerY + 10) + 'px'
					output.style.left = (d3.event.layerX - 25) + 'px'
				})
				.on('mouseout', function(d) {
					output.style.display = "none"
					output.classList.remove("operation-tooltip")
				})

				var rectRooms = svg.append('g').attr("class", "rooms")

				var i = -1, currentOpNumber = 0

				var rectRoom = rectRooms.selectAll("rect")
																.data(rooms).enter()
																.append("rect")
																.attr("rx", 3)
																.attr("ry", 3)
																.attr("x", function(d) {
																	if (typeof d.roomCode !== 'undefined') {
																		var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
																		return x(barStartTime) + sidePadding
																	} else {
																		return 0
																	}
																})
																.attr("y", function(d) {
																	if (currentOpNumber != d.opNumber) {
																		currentOpNumber = d.opNumber
																		i++
																	}
																	return i * gap + topPadding + 60
																})
																.attr("width", function(d) {
																	if (typeof d.roomCode !== 'undefined') {
																		var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
																		var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[d.events.length - 1].EVENTTIME)
																		return x(barEndTime) - x(barStartTime)
																	} else {
																		return 0
																	}
																})
																.attr("height", barHeight)
																.attr("stroke", "none")
																.attr("class", function(d) {
																	if (typeof d.roomCode !== 'undefined') {
																		return d.roomCode + " room"
																	}
																})

				rectRoom.on('mouseover', function(d) {
					var	tooltip = "<p>Theatre-Operation ID: " + d.opNumber + ' - Consultant: ' + d.events[0].CONSULTANT + '</p><br>'

					for (let i in d.events) {
						tooltip += '<p>' + d.events[i].EVENTTIME + ' ' + d.events[i].EVENTDESC + ' (' + d.events[i].EVENTCODE + ')</p>'
					}

					output.innerHTML = tooltip
					output.style.display = "block"
					output.classList.add(d.roomCode)
				})
				.on('mousemove', function(d) {
					output.style.top = (d3.event.layerY + 10) + 'px'
					output.style.left = (d3.event.layerX - 25) + 'px'
				})
				.on('mouseout', function(d) {
					output.style.display = "none"
					output.classList.remove(d.roomCode)
				})

				var operationText = svg.append("g").attr("class", "operation-text")

				operationText.selectAll("text")
										.data(operations)
										.enter()
										.append("text")
										.text(function(d) {
											if (typeof d.STARTTIME !== 'undefined') {
												return d.STARTTIME + " - " + d.ENDTIME
											} else {
												return ''
											}
										})
										.attr("x", function(d) {
											if (typeof d.STARTTIME !== 'undefined') {
												var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
												var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.ENDTIME)
												return (x(barEndTime) - x(barStartTime)) / 2 + x(barStartTime) + sidePadding
											} else {
												return 0
											}
										})
										.attr("y", function(d, i) {
											return i * gap + 74 + topPadding
										})
										.attr("font-size", 11)
										.attr("text-anchor", "middle")
										.attr("text-height", barHeight)
										.attr("fill", "#000")

				var timeline = svg.append('g').append("line")
													.attr("x1", function() {
														return x(today) + sidePadding
													})
													.attr("x2", function() {
														return x(today) + sidePadding
													})
													.attr("y1", 90)
													.attr("y2", h - 30)
													.attr("style", "stroke:rgb(255,0,0);stroke-width:1")

				/*********************************************************************************************************************************************/

				/*************************************************************** draw slider context *********************************************************/
				var context = svg.append("g")
												.attr("class", "context")
												.attr("transform", "translate(0, 0)")

				var xAxis2 = d3.svg.axis()
													.scale(x2)
													.orient('bottom')
													.tickSize(3)
													.tickPadding(8)
													.tickFormat(d3.time.format('%H:%M'))

				var extentStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 08:00:00")
				var extentEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " 17:59:59")
				var brush = d3.svg.brush().x(x2).extent([extentStartTime, extentEndTime]).on("brush", brushed)

				function brushed() {
					x.domain(brush.empty() ? x2.domain() : brush.extent())

					svg.select(".grid.bottom")
						.call(xAxisBottom)
						.selectAll("text")
						.style("text-anchor", "middle")
						.attr("fill", "#000")
						.attr("stroke", "none")
						.attr("font-size", 10)
						.attr("dy", "1em")

					svg.select(".grid.top")
						.call(xAxisTop)
						.selectAll("text")
						.style("text-anchor", "middle")
						.attr("fill", "#000")
						.attr("stroke", "none")
						.attr("font-size", 10)
						.attr("dy", "1em")

					timeline.attr("x1", function() {
										return x(today) + sidePadding
									})
									.attr("x2", function() {
										return x(today) + sidePadding
									})

					rectOperations.selectAll("rect")
												.data(operations)
												.attr("x", function(d) {
													if (typeof d.STARTTIME !== 'undefined') {
														var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
														return x(barStartTime) + sidePadding
													} else {
														return 0
													}
												})
												.attr("width", function(d) {
													if (typeof d.STARTTIME !== 'undefined') {
														var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
														var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.ENDTIME)
														return x(barEndTime) - x(barStartTime)
													} else {
														return 0
													}
												})

					rectRooms.selectAll("rect")
									.data(rooms)
									.attr("x", function(d) {
										if (typeof d.roomCode !== 'undefined') {
											var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
											return x(barStartTime) + sidePadding
										} else {
											return 0
										}
									})
									.attr("width", function(d) {
										if (typeof d.roomCode !== 'undefined') {
											var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[0].EVENTTIME)
											var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.events[d.events.length - 1].EVENTTIME)
											return x(barEndTime) - x(barStartTime)
										} else {
											return 0
										}
									})

					operationText.selectAll("text")
											.data(operations)
											.attr("x", function(d) {
												if (typeof d.STARTTIME !== 'undefined') {
													var barStartTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.STARTTIME)
													var barEndTime = new Date(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate() + " " + d.ENDTIME)

													if ((x(barEndTime) - x(barStartTime)) / 2 + x(barStartTime) < 40) {
														return -1000
													}
													return (x(barEndTime) - x(barStartTime)) / 2 + x(barStartTime) + sidePadding
												} else {
													return 0
												}
											})
				}

				context.append("g")
							.attr("class", "axis axis--x")
							.attr("transform", "translate(" + sidePadding + "," + 30 + ")")
							.call(xAxis2)

				context.append("g")
							.attr("transform", "translate(" + sidePadding + "," + 0 + ")")
							.attr("class", "brush")
							.call(brush)
							.call(brush.event)
							.selectAll("rect")
							.attr("height", 60)
				/*********************************************************************************************************************************************/
			}

			process()

			$('.group-filter').multiselect({
				columns: 1,
				placeholder: '',
				search: true,
				showCheckbox: true,
				searchOptions: {
					'default': ''
				},
				selectAll: false,
				onOptionClick : function(element, option) {
					filterValue = $('.group-filter').val()
					process()
				}
			})
		})
	})
}

dashboard()

setInterval(dashboard, 30000)

$(".room-filter").on("click", function(e) {
	e.preventDefault()

	if ($(this).data("room") == 'ALL') {
		$("rect.room").show()
	} else {
		$("rect.room").hide()
		$("rect.room." + $(this).data("room")).show()
	}
})