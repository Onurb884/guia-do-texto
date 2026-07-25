from rest_framework import permissions

# Regra: Só deixa passar se for Corretor (Staff)
class IsCorretor(permissions.BasePermission):
    def has_permission(self, request, view):
        # Permite acesso se estiver logado E (for corretor OU for da equipe/admin)
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (getattr(request.user, 'is_corretor', False) or request.user.is_staff)
        )

# Regra: O aluno só vê a dele, o Corretor vê todas
class IsDonoOuCorretor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.aluno == request.user