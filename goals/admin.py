from django.contrib import admin
from .models import Goal, ProgressLog

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    pass

@admin.register(ProgressLog)
class ProgressLogAdmin(admin.ModelAdmin):
    pass
