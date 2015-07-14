from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404

from goaltracker.json import JsonResponse, JsonRequest
from serializers import GoalSerializer, ProgressLogSerializer
from models import Goal, ProgressLog


def _get_user_goal_or_404(goal_id, user):
    goal = get_object_or_404(Goal, pk=goal_id)
    if goal.user != user:
        raise Http404('No Goal matches the given query')
    return goal


@login_required
def goal_list(request):
    if request.method == 'GET':
        goals = Goal.objects.filter(user=request.user)
        serializer = GoalSerializer(goals, many=True)
        return JsonResponse(serializer.data)

    elif request.method == 'POST':
        data = JsonRequest().parse(request)
        serializer = GoalSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return JsonResponse(serializer.data, status=201)
        return JsonResponse(serializer.errors, status=400)


@login_required
def goal_detail(request, goal_id):
    goal = _get_user_goal_or_404(goal_id, request.user)

    if request.method == 'GET':
        serializer = GoalSerializer(goal)
        return JsonResponse(serializer.data)

    elif request.method == 'PUT':
        data = JsonRequest().parse(request)
        serializer = GoalSerializer(goal, data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data)
        return JsonResponse(serializer.errors, status=400)

    elif request.method == 'DELETE':
        goal.delete()
        return HttpResponse(status=204)


@login_required
def goal_logs_list(request, goal_id):
    goal = _get_user_goal_or_404(goal_id, request.user)

    if request.method == 'GET':
        serializer = ProgressLogSerializer(goal.logs, many=True)
        return JsonResponse(serializer.data)

    elif request.method == 'POST':
        data = JsonRequest().parse(request)
        serializer = ProgressLogSerializer(data=data)
        if serializer.is_valid():
            serializer.save(goal=goal)
            return JsonResponse(serializer.data, status=201)
        return JsonResponse(serializer.errors, status=400)



@login_required
def goal_logs_detail(request, goal_id, progress_date):
    goal = _get_user_goal_or_404(goal_id, request.user)
    log_entry = get_object_or_404(ProgressLog, goal=goal, date=progress_date)

    if request.method == 'GET':
        serializer = ProgressLogSerializer(log_entry)
        return JsonResponse(serializer.data)

    elif request.method == 'POST' or request.method == 'PUT':
        data = JsonRequest().parse(request)
        # If this is a post, we are updating the record.
        # If this is a put, we are overriding the recode
        if request.method == 'POST':
            data.progress += log_entry.progress

        serializer = ProgressLogSerializer(log_entry, data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data)
        return JsonResponse(serializer.errors, status=400)

    elif request.method == 'DELETE':
        log_entry.delete()
        return HttpResponse(status=204)
