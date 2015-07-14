from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from goaltracker.json import JsonResponse, JsonRequest
from serializers import GoalSerializer
from models import Goal

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
def goal_detail(request, id):
    goal = get_object_or_404(Goal, pk=id)
    if goal.user != request.user:
        raise HttpResponse(status=404)

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

