from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import status, generics, filters, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from goaltracker.json import JsonResponse, JsonRequest
from serializers import GoalSerializer, ProgressLogSerializer
from permissions import IsOwner
from models import Goal, ProgressLog


def _get_user_goal_or_404(goal_id, user):
    goal = get_object_or_404(Goal, pk=goal_id)
    if goal.user != user:
        raise Http404('No Goal matches the given query')
    return goal


class GoalView(APIView):
    def get_goal(self, goal_id, user):
        goal = get_object_or_404(Goal, pk=goal_id)
        if goal.user != user:
            raise Http404('No Goal matches the given query')
        return goal


class GoalList(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = GoalSerializer
    filter_backends = (filters.DjangoFilterBackend,)

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GoalDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,
                          IsOwner)
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer


class GoalLogsList(GoalView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, goal_id, format=None):
        goal = self.get_goal(goal_id, request.user)
        return Response(ProgressLogSerializer(goal.logs, many=True).data)


class GoalLogsDetail(GoalView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_log(self, goal_id, progress_date, user, create_if_missing=False):
        goal = self.get_goal(goal_id, user)
        try:
            log_entry = ProgressLog.objects.get(goal=goal, date=progress_date)
        except ProgressLog.DoesNotExist:
            if not create_if_missing:
                raise Http404('No ProgressLog matches the given query')
            log_entry = ProgressLog(goal=goal, date=progress_date, progress=0)
        return log_entry

    def get(self, request, goal_id, progress_date, format=None):
        log_entry = self.get_log(goal_id, progress_date, request.user)
        return Response(ProgressLogSerializer(log_entry).data)

    def post(self, request, goal_id, progress_date, format=None):
        # Update the record
        log_entry = self.get_log(goal_id, progress_date, request.user, True)
        request.data['date'] = progress_date
        request.data['progress'] += log_entry.progress
        serializer = ProgressLogSerializer(log_entry, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, goal_id, progress_date, format=None):
        # Override the record
        log_entry = self.get_log(goal_id, progress_date, request.user, True)
        request.data['date'] = progress_date
        serializer = ProgressLogSerializer(log_entry, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, goal_id, progress_date, format=None):
        self.get_log(goal_id, progress_date, request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
