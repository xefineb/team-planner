// ===================================
// Team Planner Application
// ===================================

class TeamPlanner {
    constructor() {
        this.teams = [];
        this.interactions = [];
        this.valueStreams = [];
        this.currentTeamId = null;
        this.editingTeamId = null;
        this.editingValueStreamId = null;
        this.currentView = 'grid';
        this.draggedNode = null;

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.render();
        this.renderDiagram();
        this.renderValueStreams();
    }

    // ===================================
    // Event Listeners
    // ===================================
    setupEventListeners() {
        // View Toggle
        document.getElementById('gridViewBtn').addEventListener('click', () => {
            this.switchView('grid');
        });

        document.getElementById('diagramViewBtn').addEventListener('click', () => {
            this.switchView('diagram');
        });

        // Diagram Controls
        document.getElementById('addInteractionBtn').addEventListener('click', () => {
            this.openInteractionModal();
        });

        document.getElementById('autoLayoutBtn').addEventListener('click', () => {
            this.autoLayout();
        });

        // Interaction Form
        document.getElementById('interactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInteraction();
        });

        document.getElementById('closeInteractionModal').addEventListener('click', () => {
            this.closeInteractionModal();
        });

        document.getElementById('cancelInteractionBtn').addEventListener('click', () => {
            this.closeInteractionModal();
        });

        // Export Button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Import Button
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // Import File Input
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e);
        });

        // Add Team Button
        document.getElementById('addTeamBtn').addEventListener('click', () => {
            this.openTeamModal();
        });

        // Team Form
        document.getElementById('teamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTeam();
        });

        // Team Modal Close
        document.getElementById('closeTeamModal').addEventListener('click', () => {
            this.closeTeamModal();
        });

        document.getElementById('cancelTeamBtn').addEventListener('click', () => {
            this.closeTeamModal();
        });

        // Member Form
        document.getElementById('memberForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMember();
        });

        // Member Modal Close
        document.getElementById('closeMemberModal').addEventListener('click', () => {
            this.closeMemberModal();
        });

        document.getElementById('cancelMemberBtn').addEventListener('click', () => {
            this.closeMemberModal();
        });

        // Close modals on backdrop click
        document.getElementById('teamModal').addEventListener('click', (e) => {
            if (e.target.id === 'teamModal') {
                this.closeTeamModal();
            }
        });

        document.getElementById('memberModal').addEventListener('click', (e) => {
            if (e.target.id === 'memberModal') {
                this.closeMemberModal();
            }
        });

        document.getElementById('interactionModal').addEventListener('click', (e) => {
            if (e.target.id === 'interactionModal') {
                this.closeInteractionModal();
            }
        });
    }

    // ===================================
    // Team Management
    // ===================================
    openTeamModal(teamId = null) {
        this.editingTeamId = teamId;
        const modal = document.getElementById('teamModal');
        const form = document.getElementById('teamForm');
        const title = document.getElementById('modalTitle');

        if (teamId) {
            const team = this.teams.find(t => t.id === teamId);
            title.textContent = 'Edit Team';
            document.getElementById('teamName').value = team.name;
            document.getElementById('teamType').value = team.type;
            document.getElementById('teamDescription').value = team.description;
        } else {
            title.textContent = 'Add Team';
            form.reset();
        }

        modal.classList.add('active');
    }

    closeTeamModal() {
        document.getElementById('teamModal').classList.remove('active');
        document.getElementById('teamForm').reset();
        this.editingTeamId = null;
    }

    saveTeam() {
        const name = document.getElementById('teamName').value.trim();
        const type = document.getElementById('teamType').value;
        const description = document.getElementById('teamDescription').value.trim();

        if (!name || !type) {
            alert('Please fill in all required fields');
            return;
        }

        if (this.editingTeamId) {
            // Edit existing team
            const team = this.teams.find(t => t.id === this.editingTeamId);
            team.name = name;
            team.type = type;
            team.description = description;
        } else {
            // Create new team
            const team = {
                id: this.generateId(),
                name,
                type,
                description,
                members: []
            };
            this.teams.push(team);
        }

        this.saveToStorage();
        this.render();
        this.closeTeamModal();
    }

    deleteTeam(teamId) {
        if (confirm('Are you sure you want to delete this team?')) {
            this.teams = this.teams.filter(t => t.id !== teamId);
            this.saveToStorage();
            this.render();
        }
    }

    // ===================================
    // Member Management
    // ===================================
    openMemberModal(teamId) {
        this.currentTeamId = teamId;
        const modal = document.getElementById('memberModal');
        document.getElementById('memberForm').reset();
        modal.classList.add('active');
    }

    closeMemberModal() {
        document.getElementById('memberModal').classList.remove('active');
        document.getElementById('memberForm').reset();
        this.currentTeamId = null;
    }

    saveMember() {
        const name = document.getElementById('memberName').value.trim();
        const role = document.getElementById('memberRole').value.trim();

        if (!name || !role) {
            alert('Please fill in all fields');
            return;
        }

        const team = this.teams.find(t => t.id === this.currentTeamId);
        if (team) {
            const member = {
                id: this.generateId(),
                name,
                role
            };
            team.members.push(member);
            this.saveToStorage();
            this.render();
            this.closeMemberModal();
        }
    }

    removeMember(teamId, memberId) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.members = team.members.filter(m => m.id !== memberId);
            this.saveToStorage();
            this.render();
        }
    }

    // ===================================
    // Rendering
    // ===================================
    render() {
        const grid = document.getElementById('teamsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.teams.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.add('visible');
        } else {
            emptyState.classList.remove('visible');
            grid.innerHTML = this.teams.map(team => this.renderTeamCard(team)).join('');
            this.attachCardEventListeners();
        }
    }

    renderTeamCard(team) {
        const typeLabels = {
            'stream-aligned': 'Stream-Aligned Team',
            'enabling': 'Enabling Team',
            'complicated-subsystem': 'Complicated Subsystem Team',
            'platform': 'Platform Team'
        };

        return `
            <div class="team-card" data-type="${team.type}" data-team-id="${team.id}">
                <div class="team-card-header">
                    <h3 class="team-name">${this.escapeHtml(team.name)}</h3>
                    <span class="team-type-badge">${typeLabels[team.type]}</span>
                </div>
                
                <p class="team-description">${this.escapeHtml(team.description) || 'No description provided'}</p>
                
                <div class="team-members">
                    <h4 class="team-members-title">Team Members (${team.members.length})</h4>
                    <div class="members-list">
                        ${team.members.length > 0
                ? team.members.map(member => this.renderMember(member, team.id)).join('')
                : '<p style="color: var(--color-text-muted); font-size: var(--font-size-sm); padding: var(--space-sm);">No members yet</p>'
            }
                    </div>
                </div>
                
                <div class="team-actions">
                    <button class="btn btn-secondary btn-small add-member-btn" data-team-id="${team.id}">
                        <span class="btn-icon">+</span>
                        Add Member
                    </button>
                    <button class="btn btn-secondary btn-small edit-team-btn" data-team-id="${team.id}">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger btn-small delete-team-btn" data-team-id="${team.id}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }

    renderMember(member, teamId) {
        const initials = this.getInitials(member.name);

        return `
            <div class="member-item">
                <div class="member-avatar">${initials}</div>
                <div class="member-info">
                    <div class="member-name">${this.escapeHtml(member.name)}</div>
                    <div class="member-role">${this.escapeHtml(member.role)}</div>
                </div>
                <button class="member-remove" data-team-id="${teamId}" data-member-id="${member.id}" title="Remove member">×</button>
            </div>
        `;
    }

    attachCardEventListeners() {
        // Add Member buttons
        document.querySelectorAll('.add-member-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                this.openMemberModal(teamId);
            });
        });

        // Edit Team buttons
        document.querySelectorAll('.edit-team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                this.openTeamModal(teamId);
            });
        });

        // Delete Team buttons
        document.querySelectorAll('.delete-team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                this.deleteTeam(teamId);
            });
        });

        // Remove Member buttons
        document.querySelectorAll('.member-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                const memberId = e.currentTarget.dataset.memberId;
                this.removeMember(teamId, memberId);
            });
        });
    }

    // ===================================
    // Export/Import
    // ===================================
    exportData() {
        const data = {
            teams: this.teams,
            interactions: this.interactions
        };
        const dataStr = JSON.stringify(data, null, 2);
        // Use text/plain to avoid browser issues with custom extensions
        const dataBlob = new Blob([dataStr], { type: 'text/plain' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `team-planner-${timestamp}.team`;
        link.download = filename;

        // Set additional attributes to ensure download
        link.setAttribute('download', filename);
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        // Clean up after a short delay
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        // Show success message
        this.showNotification('Teams exported successfully!', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                // Handle both old format (array) and new format (object)
                let importedTeams, importedInteractions;
                if (Array.isArray(imported)) {
                    importedTeams = imported;
                    importedInteractions = [];
                } else {
                    importedTeams = imported.teams || [];
                    importedInteractions = imported.interactions || [];
                }

                // Validate the data structure
                if (!Array.isArray(importedTeams)) {
                    throw new Error('Invalid data format');
                }

                // Confirm before overwriting
                const confirmMsg = `This will replace your current ${this.teams.length} team(s) with ${importedTeams.length} imported team(s). Continue?`;
                if (this.teams.length > 0 && !confirm(confirmMsg)) {
                    return;
                }

                this.teams = importedTeams;
                this.interactions = importedInteractions;
                this.saveToStorage();
                this.render();
                this.renderDiagram();
                this.showNotification('Teams imported successfully!', 'success');
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Failed to import teams. Please check the file format.', 'error');
            }
        };

        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ===================================
    // View Management
    // ===================================
    switchView(view) {
        this.currentView = view;

        // Update toggle buttons
        document.getElementById('gridViewBtn').classList.toggle('active', view === 'grid');
        document.getElementById('diagramViewBtn').classList.toggle('active', view === 'diagram');

        // Update view containers
        document.getElementById('gridView').classList.toggle('active', view === 'grid');
        document.getElementById('diagramView').classList.toggle('active', view === 'diagram');

        if (view === 'diagram') {
            this.renderDiagram();
        }
    }

    // ===================================
    // Diagram Rendering
    // ===================================
    renderDiagram() {
        const svg = document.getElementById('diagramSvg');
        const emptyState = document.getElementById('diagramEmptyState');

        if (this.teams.length === 0) {
            svg.style.display = 'none';
            emptyState.classList.add('visible');
            return;
        }

        svg.style.display = 'block';
        emptyState.classList.remove('visible');

        // Clear existing content
        svg.innerHTML = '';

        // Create defs for arrow markers
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        ['collaboration', 'x-as-a-service', 'facilitation'].forEach(type => {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', `arrow-${type}`);
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('markerUnits', 'strokeWidth');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M0,0 L0,6 L9,3 z');
            path.setAttribute('fill', this.getInteractionColor(type));
            marker.appendChild(path);
            defs.appendChild(marker);
        });
        svg.appendChild(defs);

        // Initialize positions if not set
        this.teams.forEach((team, index) => {
            if (!team.x || !team.y) {
                const angle = (index / this.teams.length) * 2 * Math.PI;
                const radius = 200;
                team.x = 400 + radius * Math.cos(angle);
                team.y = 300 + radius * Math.sin(angle);
            }
        });

        // Draw interactions first (so they appear behind nodes)
        this.interactions.forEach((interaction, index) => {
            this.drawInteraction(svg, interaction, index);
        });

        // Draw team nodes
        this.teams.forEach(team => {
            this.drawTeamNode(svg, team);
        });
    }

    drawTeamNode(svg, team) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('team-node');
        g.setAttribute('data-team-id', team.id);
        g.setAttribute('transform', `translate(${team.x}, ${team.y})`);

        // Calculate role counts
        const roleCounts = {};
        team.members.forEach(member => {
            roleCounts[member.role] = (roleCounts[member.role] || 0) + 1;
        });
        const roles = Object.entries(roleCounts);

        // Rectangle dimensions
        const width = 200;
        const headerHeight = 50;
        const roleHeight = 20;
        const padding = 10;
        const totalHeight = headerHeight + (roles.length > 0 ? roles.length * roleHeight + padding : 20);

        // Background rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.classList.add('node-rect');
        rect.setAttribute('x', -width / 2);
        rect.setAttribute('y', -totalHeight / 2);
        rect.setAttribute('width', width);
        rect.setAttribute('height', totalHeight);
        rect.setAttribute('rx', '8');
        rect.setAttribute('fill', 'var(--color-bg-card)');
        rect.setAttribute('stroke', this.getTeamColor(team.type));
        rect.setAttribute('stroke-width', '3');
        g.appendChild(rect);

        // Header background (colored bar)
        const headerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        headerRect.setAttribute('x', -width / 2);
        headerRect.setAttribute('y', -totalHeight / 2);
        headerRect.setAttribute('width', width);
        headerRect.setAttribute('height', headerHeight);
        headerRect.setAttribute('rx', '8');
        headerRect.setAttribute('fill', this.getTeamColor(team.type));
        headerRect.setAttribute('opacity', '0.2');
        g.appendChild(headerRect);

        // Team name
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.classList.add('node-text');
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('x', '0');
        nameText.setAttribute('y', -totalHeight / 2 + 22);
        nameText.textContent = this.truncateText(team.name, 20);
        g.appendChild(nameText);

        // Team type badge
        const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeText.classList.add('node-type');
        typeText.setAttribute('text-anchor', 'middle');
        typeText.setAttribute('x', '0');
        typeText.setAttribute('y', -totalHeight / 2 + 38);
        typeText.textContent = this.getTeamTypeShort(team.type);
        g.appendChild(typeText);

        // Role breakdown
        if (roles.length > 0) {
            roles.forEach((role, index) => {
                const [roleName, count] = role;
                const yPos = -totalHeight / 2 + headerHeight + padding + (index * roleHeight) + 14;

                // Role name
                const roleNameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                roleNameText.classList.add('node-role-name');
                roleNameText.setAttribute('text-anchor', 'start');
                roleNameText.setAttribute('x', -width / 2 + 10);
                roleNameText.setAttribute('y', yPos);
                roleNameText.textContent = this.truncateText(roleName, 18);
                g.appendChild(roleNameText);

                // Role count
                const roleCountText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                roleCountText.classList.add('node-role-count');
                roleCountText.setAttribute('text-anchor', 'end');
                roleCountText.setAttribute('x', width / 2 - 10);
                roleCountText.setAttribute('y', yPos);
                roleCountText.textContent = count;
                g.appendChild(roleCountText);
            });
        } else {
            // No members message
            const noMembersText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            noMembersText.classList.add('node-role-name');
            noMembersText.setAttribute('text-anchor', 'middle');
            noMembersText.setAttribute('x', '0');
            noMembersText.setAttribute('y', -totalHeight / 2 + headerHeight + 15);
            noMembersText.textContent = 'No members';
            noMembersText.setAttribute('opacity', '0.5');
            g.appendChild(noMembersText);
        }

        // Add drag behavior
        this.addDragBehavior(g, team);

        svg.appendChild(g);
    }

    drawInteraction(svg, interaction, index) {
        const fromTeam = this.teams.find(t => t.id === interaction.from);
        const toTeam = this.teams.find(t => t.id === interaction.to);

        if (!fromTeam || !toTeam) return;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('interaction-group');

        // Rectangle dimensions (must match drawTeamNode)
        const rectWidth = 200;
        const rectHalfWidth = rectWidth / 2;

        // Calculate connection points on rectangle edges
        const dx = toTeam.x - fromTeam.x;
        const dy = toTeam.y - fromTeam.y;

        // Determine which edge to connect to based on angle
        let x1, y1, x2, y2;

        // From team connection point
        if (Math.abs(dx) > Math.abs(dy)) {
            // Connect to left or right edge
            x1 = fromTeam.x + (dx > 0 ? rectHalfWidth : -rectHalfWidth);
            y1 = fromTeam.y;
        } else {
            // Connect to top or bottom edge
            x1 = fromTeam.x;
            y1 = fromTeam.y + (dy > 0 ? 40 : -40); // Approximate half-height
        }

        // To team connection point
        if (Math.abs(dx) > Math.abs(dy)) {
            // Connect to left or right edge
            x2 = toTeam.x + (dx > 0 ? -rectHalfWidth : rectHalfWidth);
            y2 = toTeam.y;
        } else {
            // Connect to top or bottom edge
            x2 = toTeam.x;
            y2 = toTeam.y + (dy > 0 ? -40 : 40); // Approximate half-height
        }

        // Draw line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('interaction-line', interaction.type);
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('marker-end', `url(#arrow-${interaction.type})`);
        g.appendChild(line);

        // Label
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.classList.add('interaction-label');
        label.setAttribute('x', midX);
        label.setAttribute('y', midY - 5);
        label.setAttribute('text-anchor', 'middle');
        label.textContent = this.getInteractionLabel(interaction.type);
        g.appendChild(label);

        // Delete button
        const deleteBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        deleteBtn.classList.add('interaction-delete');
        deleteBtn.setAttribute('transform', `translate(${midX}, ${midY + 10})`);
        deleteBtn.style.cursor = 'pointer';

        const deleteCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        deleteCircle.setAttribute('r', '10');
        deleteBtn.appendChild(deleteCircle);

        const deleteText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        deleteText.setAttribute('text-anchor', 'middle');
        deleteText.setAttribute('y', '5');
        deleteText.textContent = '×';
        deleteBtn.appendChild(deleteText);

        deleteBtn.addEventListener('click', () => {
            this.deleteInteraction(index);
        });

        g.appendChild(deleteBtn);
        svg.appendChild(g);
    }

    addDragBehavior(element, team) {
        let isDragging = false;
        let startX, startY;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            const svg = document.getElementById('diagramSvg');
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
            startX = svgP.x - team.x;
            startY = svgP.y - team.y;
            element.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const svg = document.getElementById('diagramSvg');
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

            team.x = svgP.x - startX;
            team.y = svgP.y - startY;

            this.renderDiagram();
            this.saveToStorage();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
            }
        });
    }

    // ===================================
    // Interaction Management
    // ===================================
    openInteractionModal() {
        if (this.teams.length < 2) {
            alert('You need at least 2 teams to create an interaction');
            return;
        }

        const modal = document.getElementById('interactionModal');
        const fromSelect = document.getElementById('fromTeam');
        const toSelect = document.getElementById('toTeam');

        // Populate team dropdowns
        fromSelect.innerHTML = '<option value="">Select team...</option>';
        toSelect.innerHTML = '<option value="">Select team...</option>';

        this.teams.forEach(team => {
            const option1 = document.createElement('option');
            option1.value = team.id;
            option1.textContent = team.name;
            fromSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = team.id;
            option2.textContent = team.name;
            toSelect.appendChild(option2);
        });

        modal.classList.add('active');
    }

    closeInteractionModal() {
        document.getElementById('interactionModal').classList.remove('active');
        document.getElementById('interactionForm').reset();
    }

    saveInteraction() {
        const from = document.getElementById('fromTeam').value;
        const to = document.getElementById('toTeam').value;
        const type = document.getElementById('interactionType').value;

        if (!from || !to || !type) {
            alert('Please fill in all fields');
            return;
        }

        if (from === to) {
            alert('A team cannot interact with itself');
            return;
        }

        // Check for duplicate
        const exists = this.interactions.some(i =>
            i.from === from && i.to === to
        );

        if (exists) {
            alert('An interaction already exists between these teams');
            return;
        }

        this.interactions.push({ from, to, type });
        this.saveToStorage();
        this.renderDiagram();
        this.closeInteractionModal();
        this.showNotification('Interaction added successfully!', 'success');
    }

    deleteInteraction(index) {
        if (confirm('Delete this interaction?')) {
            this.interactions.splice(index, 1);
            this.saveToStorage();
            this.renderDiagram();
        }
    }

    autoLayout() {
        const radius = 200;
        const centerX = 400;
        const centerY = 300;

        this.teams.forEach((team, index) => {
            const angle = (index / this.teams.length) * 2 * Math.PI;
            team.x = centerX + radius * Math.cos(angle);
            team.y = centerY + radius * Math.sin(angle);
        });

        this.saveToStorage();
        this.renderDiagram();
        this.showNotification('Layout updated!', 'success');
    }

    // ===================================
    // Helper Methods
    // ===================================
    getTeamColor(type) {
        const colors = {
            'stream-aligned': 'hsl(200, 85%, 55%)',
            'enabling': 'hsl(150, 70%, 50%)',
            'complicated-subsystem': 'hsl(30, 90%, 60%)',
            'platform': 'hsl(280, 70%, 60%)'
        };
        return colors[type] || 'hsl(0, 0%, 50%)';
    }

    getTeamTypeShort(type) {
        const labels = {
            'stream-aligned': 'Stream',
            'enabling': 'Enabling',
            'complicated-subsystem': 'Subsystem',
            'platform': 'Platform'
        };
        return labels[type] || type;
    }

    getInteractionColor(type) {
        const colors = {
            'collaboration': 'hsl(200, 85%, 55%)',
            'x-as-a-service': 'hsl(280, 70%, 60%)',
            'facilitation': 'hsl(150, 70%, 50%)'
        };
        return colors[type] || 'hsl(0, 0%, 50%)';
    }

    getInteractionLabel(type) {
        const labels = {
            'collaboration': 'Collaboration',
            'x-as-a-service': 'X-as-a-Service',
            'facilitation': 'Facilitation'
        };
        return labels[type] || type;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 1) + '…';
    }

    // ===================================
    // Storage
    // ===================================
    saveToStorage() {
        const data = {
            teams: this.teams,
            interactions: this.interactions
        };
        localStorage.setItem('teamPlannerData', JSON.stringify(data));
    }

    loadFromStorage() {
        const dataStr = localStorage.getItem('teamPlannerData');
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                // Handle both old format (just teams array) and new format (object with teams and interactions)
                if (Array.isArray(data)) {
                    this.teams = data;
                    this.interactions = [];
                } else {
                    this.teams = data.teams || [];
                    this.interactions = data.interactions || [];
                }
            } catch (e) {
                console.error('Failed to load data from storage', e);
                this.teams = [];
                this.interactions = [];
            }
        }
    }

    // ===================================
    // Utilities
    // ===================================
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substr(0, 2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TeamPlanner();
});
