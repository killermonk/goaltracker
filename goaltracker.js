window.GoalTracker = Class.create({
	initialize:function($container) {
		this.$container = $container;
		
		var goals_str = localStorage.getItem('gt_goals');
		if (goals_str) {
			this.goals = JSON.parse(goals_str);
		} else {
			this.goals = {};
		}
	},
	save: function() {
		localStorage.setItem('gt_goals', JSON.stringify(this.goals));
	},
	build: function() {
		var that = this;
		this.$container.innerHTML = '';

		var add_goal_name = el('input', {'type':'text'});
		var add_goal_total = el('input', {'type':'text'});
		var add_goal_days = el('input', {'type':'text'});
		var add_goal_submit = el('input', {'type':'submit', 'class':'add_goal_submit'});
		add_goal_submit.observe('click', function(e) {
			Event.stop(e);

			that.add_goal(add_goal_name, add_goal_total, add_goal_days);
		});

		this.$container.appendChild(el('div', {'class':'add_goal'}, [
			el('label', null, ['New Goal Name']),
			add_goal_name,
			el('br'),
			el('label', null, ['Total Required']),
			add_goal_total,
			el('br'),
			el('label', null, ['Due in days']),
			add_goal_days,
			el('br'),
			add_goal_submit
		]));

		if (this.goals) {
			for (var name in this.goals) {
				var goal = this.goals[name];

				var now = new Date();
				var today_str = (now.getMonth()+1) + '/' + (now.getDate()+1) + '/' + (now.getFullYear());
				
				var start_date = new Date(Date.parse(goal.start));
				var end_date = new Date(Date.parse(goal.end));

				var total_days = Math.floor((end_date - start_date) / 86400000);
				var elapsed_days = Math.floor((now - start_date) / 86400000);
				var days_left = Math.max(1, total_days - elapsed_days - 1);

				var finished = false;
				var pace_percent = (elapsed_days + 1) / total_days;
				var pace_total = pace_percent * goal.total;
				if (elapsed_days > total_days) {
					finished = true;
					pace_percent = 1;
					pace_total = goal.total;
				}

				var progress_container = null;
				if (!finished) {
					var add_progress_total = el('input', {'type':'text'});
					var add_progress_button = el('input', {'type':'submit'});
					var add_progress_container = el('div', {'class':'add_progress'}, [
						el('label', null, ['Add Progress']),
						add_progress_total,
						add_progress_button
					]);

					add_progress_button.observe('click', function(name, add_progress_total, e) {
						Event.stop(e);
						that.add_progress(name, add_progress_total);
					}.bind(that, name, add_progress_total));

					progress_container = el('div', {'class':'task_progress'}, [
						add_progress_container
					]);
				}

				var goal_progress = 0;
				var daily_progress = {};
				goal.log.forEach(function(entry) {
					goal_progress += entry.progress;

					var log_date = new Date(Date.parse(entry.date));
					var date_str = (log_date.getMonth()+1) + '/' + (log_date.getDate()+1) + '/' + (log_date.getFullYear());

					if (!daily_progress[date_str])
						daily_progress[date_str] = 0;
					daily_progress[date_str] += entry.progress
				});

				var per_day_str = Math.ceil((goal.total - goal_progress) / days_left);

				if (progress_container) {
					for (var date_str in daily_progress) {
						var day_current = daily_progress[date_str];
						var day_left = Math.max(0, per_day_str - day_current);

						var day_progress_str = day_current;
						if (date_str == today_str) {
							day_progress_str += ' (' + day_left + ' left)';
						}

						var log_div = el('div', {'class':'log_entry'}, [
							el('label', null, [date_str]),
							el('span', null, [day_progress_str])
						]);

						progress_container.appendChild(log_div);
					}
				}

				var goal_percent = goal_progress / goal.total;
				var goal_percent_str = (goal_percent * 100).toPrecision(2);
				var pace_percent_str = (pace_percent * 100).toPrecision(2);

				var pace_str = goal_percent_str + '% of ' + goal.total;
				if (goal_percent > pace_percent) {
					pace_str += ' (' + (goal_percent_str - pace_percent_str).toPrecision(2) + '% ahead of pace)';
				} else {
					pace_str += ' (' + (pace_percent_str - goal_percent_str).toPrecision(2) + '% behind pace)';
				}

				this.$container.appendChild(el('div', {'class':'goal'}, [
					el('h2', null, [name + ' (' + per_day_str + ' / day) due ' + (end_date.getMonth()+1) + '/' + (end_date.getDate()+1) + '/' + (end_date.getFullYear())]),
					el('div', {'class':'outer_progress'}, [
						el('div', {'class':'pace_progress', 'style':'width:'+pace_percent_str+'%'}),
						el('div', {'class':'inner_progress', 'style':'width:'+goal_percent_str+'%'})
					]),
					el('span', {'class':'progress_text'}, [pace_str]),
					progress_container
				]));
			}
		}
	},
	add_goal: function($goal_name, $goal_total, $goal_days) {
		var name = $F($goal_name);
		var total = Number($F($goal_total));
		var days = Number($F($goal_days));
		
		if (!name || name.length == 0) {
			alert("Goal Name is required");
			return false;
		}
		if (isNaN(total) || total <= 0) {
			alert("Total value must be a number greater than 0");
			return false;
		}
		if (isNaN(days) || days <= 0) {
			alert("Days value must be a number greater than 0");
			return false;
		}

		if (this.goals[name]) {
			alert("Goal " + name + " already exists. Please pick another name");
			return false;
		}

		var start_date = new Date();
		var end_date = new Date(start_date.getTime() + days*86400000);

		this.goals[name] = {
			'total': total,
			'start': start_date,
			'end': end_date,
			'log': []
		};
		this.save()
		this.build();
	},
	add_progress: function(goal_name, $progress_total) {
		console.log(goal_name, $progress_total);
		if (!this.goals[goal_name]) {
			alert("Invalid goal " + goal_name);
			return false;
		}

		var progress = Number($F($progress_total));
		if (isNaN(progress) || progress <= 0) {
			alert("Progress must be greater than 0");
			return false;
		}

		this.goals[goal_name].log.push({
			'date': new Date(),
			'progress': progress
		});
		this.save();
		this.build();
	}
});

function el(type, attrs, children) {
	var el = document.createElement(type);
	if (attrs) {
		for (var key in attrs) {
			el.setAttribute(key, attrs[key]);
		}
	}

	if (children) {
		children.forEach(function(child){
			if (child) {
				if (typeof child != 'object') {
					child = document.createTextNode(child);
				} 
				el.appendChild(child);
			}
		});
	}

	return el;
}