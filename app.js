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
        this.editingInteractionIndex = null;
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

        document.getElementById('valueStreamsViewBtn').addEventListener('click', () => {
            this.switchView('valueStreams');
        });

        // Topology Diagram Controls
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

        // Member Modal
        document.getElementById('memberForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMember();
        });

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

        // Value Stream Form Modal
        document.getElementById('valueStreamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveValueStream();
        });

        document.getElementById('closeValueStreamFormModal').addEventListener('click', () => {
            this.closeValueStreamFormModal();
        });

        document.getElementById('cancelValueStreamBtn').addEventListener('click', () => {
            this.closeValueStreamFormModal();
        });

        // Color preset selection
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                document.getElementById('valueStreamColor').value = color;
            });
        });

        // Close value stream form modal on backdrop click
        document.getElementById('valueStreamFormModal').addEventListener('click', (e) => {
            if (e.target.id === 'valueStreamFormModal') {
                this.closeValueStreamFormModal();
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
            if (team) {
                title.textContent = 'Edit Team';
                document.getElementById('teamName').value = team.name;
                document.getElementById('teamType').value = team.type;
                document.getElementById('teamDescription').value = team.description || '';

                // Render value stream checkboxes and check the team's value streams
                this.renderValueStreamCheckboxes(team.valueStreams || []);
            }
        } else {
            title.textContent = 'Add Team';
            form.reset();
            // Render value stream checkboxes with none selected
            this.renderValueStreamCheckboxes([]);
        }

        modal.classList.add('active');
    }

    renderValueStreamCheckboxes(selectedIds = []) {
        const container = document.getElementById('valueStreamCheckboxes');

        if (this.valueStreams.length === 0) {
            container.innerHTML = '<p style="color: var(--color-text-muted); font-size: var(--font-size-sm);">No value streams available. Create value streams first.</p>';
            return;
        }

        container.innerHTML = this.valueStreams.map(vs => `
            <div class="checkbox-item">
                <input type="checkbox" 
                       id="vs-${vs.id}" 
                       value="${vs.id}" 
                       ${selectedIds.includes(vs.id) ? 'checked' : ''}>
                <div class="color-indicator" style="background: ${vs.color};"></div>
                <label for="vs-${vs.id}">${this.escapeHtml(vs.name)}</label>
            </div>
        `).join('');
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

        // Collect selected value streams
        const selectedValueStreams = Array.from(
            document.querySelectorAll('#valueStreamCheckboxes input[type="checkbox"]:checked')
        ).map(cb => cb.value);

        // Enforce 4-stream limit
        if (selectedValueStreams.length > 4) {
            alert('A team can belong to a maximum of 4 value streams for cognitive load management.');
            return;
        }

        if (this.editingTeamId) {
            const team = this.teams.find(t => t.id === this.editingTeamId);
            if (team) {
                team.name = name;
                team.type = type;
                team.description = description;
                team.valueStreams = selectedValueStreams;
            }
        } else {
            this.teams.push({
                id: this.generateId(),
                name,
                type,
                description,
                valueStreams: selectedValueStreams,
                members: []
            });
        }

        this.saveToStorage();
        this.render();
        this.renderDiagram();
        this.closeTeamModal();
    }

    deleteTeam(teamId) {
        setTimeout(() => {
            if (confirm('Are you sure you want to delete this team?')) {
                this.teams = this.teams.filter(t => t.id !== teamId);
                this.saveToStorage();
                this.render();
                this.renderDiagram(); // Also update topology view
            }
        }, 0);
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
            'stream-aligned': 'Stream-Aligned',
            'enabling': 'Enabling',
            'complicated-subsystem': 'Complicated Subsystem',
            'platform': 'Platform'
        };

        const membersHtml = team.members.length > 0
            ? `<div class="team-members">
                    <div class="team-members-title">Team Members</div>
                    <div class="members-list">
                        ${team.members.map(member => `
                            <div class="member-item">
                                <div class="member-avatar">${member.name.charAt(0).toUpperCase()}</div>
                                <div class="member-info">
                                    <div class="member-name">${this.escapeHtml(member.name)}</div>
                                    <div class="member-role">${this.escapeHtml(member.role)}</div>
                                </div>
                                <button class="member-remove" data-team-id="${team.id}" data-member-id="${member.id}">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>`
            : '';

        // Render value stream tags
        const valueStreamTags = this.renderValueStreamTags(team.valueStreams || []);

        return `
            <div class="team-card" data-type="${team.type}" data-team-id="${team.id}">
                <div class="team-card-header">
                    <h3 class="team-name">${this.escapeHtml(team.name)}</h3>
                    <span class="team-type-badge">${typeLabels[team.type]}</span>
                </div>
                <p class="team-description">${this.escapeHtml(team.description || '')}</p>
                ${valueStreamTags}
                ${membersHtml}
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

    renderValueStreamTags(valueStreamIds) {
        if (!valueStreamIds || valueStreamIds.length === 0) {
            return '';
        }

        const tags = valueStreamIds
            .map(id => this.valueStreams.find(vs => vs.id === id))
            .filter(vs => vs) // Filter out any that don't exist
            .map(vs => `
                <span class="value-stream-tag" style="--vs-color: ${vs.color};">
                    ${this.escapeHtml(vs.name)}
                </span>
            `)
            .join('');

        return tags ? `<div class="value-stream-tags">${tags}</div>` : '';
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
                e.preventDefault();
                e.stopPropagation();
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

        // Update buttons
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Hide all views
        document.getElementById('gridView').classList.remove('active');
        document.getElementById('diagramView').classList.remove('active');
        document.getElementById('valueStreamsView').classList.remove('active');

        // Show selected view
        if (view === 'grid') {
            document.getElementById('gridViewBtn').classList.add('active');
            document.getElementById('gridView').classList.add('active');
        } else if (view === 'diagram') {
            document.getElementById('diagramViewBtn').classList.add('active');
            document.getElementById('diagramView').classList.add('active');
            this.renderDiagram();
        } else if (view === 'valueStreams') {
            document.getElementById('valueStreamsViewBtn').classList.add('active');
            document.getElementById('valueStreamsView').classList.add('active');
            this.renderValueStreams();
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

        // Get value streams for this team
        const teamValueStreams = (team.valueStreams || [])
            .map(id => this.valueStreams.find(vs => vs.id === id))
            .filter(vs => vs);

        // Rectangle dimensions
        const width = 200;
        const headerHeight = 50;
        const roleHeight = 20;
        const padding = 10;
        const vsHeight = teamValueStreams.length > 0 ? 25 : 0; // Space for value stream indicators
        const totalHeight = headerHeight + (roles.length > 0 ? roles.length * roleHeight + padding : 20) + vsHeight;

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

        // Value stream indicators (small colored circles)
        if (teamValueStreams.length > 0) {
            const circleRadius = 6;
            const circleSpacing = 16;
            const totalWidth = teamValueStreams.length * circleSpacing - 4;
            const startX = -totalWidth / 2;
            const yPos = totalHeight / 2 - 15;

            teamValueStreams.forEach((vs, index) => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.classList.add('vs-indicator');
                circle.setAttribute('cx', startX + (index * circleSpacing));
                circle.setAttribute('cy', yPos);
                circle.setAttribute('r', circleRadius);
                circle.setAttribute('fill', vs.color);
                circle.setAttribute('stroke', 'var(--color-bg-card)');
                circle.setAttribute('stroke-width', '2');

                // Add title for tooltip
                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = vs.name;
                circle.appendChild(title);

                g.appendChild(circle);
            });
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

        // Calculate line endpoints (from edge of rectangles)
        const dx = toTeam.x - fromTeam.x;
        const dy = toTeam.y - fromTeam.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Approximate rectangle edge intersection
        const angle = Math.atan2(dy, dx);
        const rectWidth = 200;
        const rectHeight = 100; // Approximate

        const offsetX1 = Math.cos(angle) * (rectWidth / 2);
        const offsetY1 = Math.sin(angle) * (rectHeight / 2);
        const offsetX2 = Math.cos(angle + Math.PI) * (rectWidth / 2);
        const offsetY2 = Math.sin(angle + Math.PI) * (rectHeight / 2);

        const x1 = fromTeam.x + offsetX1;
        const y1 = fromTeam.y + offsetY1;
        const x2 = toTeam.x + offsetX2;
        const y2 = toTeam.y + offsetY2;

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
        label.setAttribute('y', midY - 15);
        label.setAttribute('text-anchor', 'middle');
        label.textContent = this.getInteractionLabel(interaction.type);
        g.appendChild(label);

        // Edit button
        const editBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        editBtn.classList.add('interaction-edit');
        editBtn.setAttribute('transform', `translate(${midX - 30}, ${midY + 10})`);
        editBtn.style.cursor = 'pointer';

        const editCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        editCircle.setAttribute('r', '10');
        editBtn.appendChild(editCircle);

        const editText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        editText.setAttribute('text-anchor', 'middle');
        editText.setAttribute('y', '4');
        editText.textContent = '✏';
        editText.style.fontSize = '12px';
        editBtn.appendChild(editText);

        editBtn.addEventListener('click', () => {
            this.editInteraction(index);
        });

        g.appendChild(editBtn);

        // Swap button (reverse direction)
        const swapBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        swapBtn.classList.add('interaction-swap');
        swapBtn.setAttribute('transform', `translate(${midX}, ${midY + 10})`);
        swapBtn.style.cursor = 'pointer';

        const swapCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        swapCircle.setAttribute('r', '10');
        swapBtn.appendChild(swapCircle);

        const swapText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        swapText.setAttribute('text-anchor', 'middle');
        swapText.setAttribute('y', '4');
        swapText.textContent = '⇄';
        swapText.style.fontSize = '14px';
        swapBtn.appendChild(swapText);

        swapBtn.addEventListener('click', () => {
            this.swapInteraction(index);
        });

        g.appendChild(swapBtn);

        // Delete button
        const deleteBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        deleteBtn.classList.add('interaction-delete');
        deleteBtn.setAttribute('transform', `translate(${midX + 30}, ${midY + 10})`);
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
    openInteractionModal(interactionIndex = null) {
        this.editingInteractionIndex = interactionIndex;
        const modal = document.getElementById('interactionModal');
        const fromSelect = document.getElementById('fromTeam');
        const toSelect = document.getElementById('toTeam');
        const typeSelect = document.getElementById('interactionType');

        // Populate team dropdowns
        const teamOptions = this.teams.map(team =>
            `<option value="${team.id}">${this.escapeHtml(team.name)}</option>`
        ).join('');

        fromSelect.innerHTML = '<option value="">Select team...</option>' + teamOptions;
        toSelect.innerHTML = '<option value="">Select team...</option>' + teamOptions;

        // If editing, populate with existing values
        if (interactionIndex !== null) {
            const interaction = this.interactions[interactionIndex];
            if (interaction) {
                fromSelect.value = interaction.from;
                toSelect.value = interaction.to;
                typeSelect.value = interaction.type;
            }
        } else {
            // Reset for new interaction
            fromSelect.value = '';
            toSelect.value = '';
            typeSelect.value = '';
        }

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
            alert('A team cannot have an interaction with itself');
            return;
        }

        if (this.editingInteractionIndex !== null) {
            // Update existing interaction
            this.interactions[this.editingInteractionIndex] = { from, to, type };
            this.editingInteractionIndex = null;
        } else {
            // Check for duplicates (only for new interactions)
            const exists = this.interactions.some(i =>
                i.from === from && i.to === to
            );

            if (exists) {
                alert('An interaction already exists between these teams');
                return;
            }

            this.interactions.push({ from, to, type });
        }

        this.saveToStorage();
        this.renderDiagram();
        this.closeInteractionModal();
        this.showNotification('Interaction saved successfully!', 'success');
    }

    editInteraction(index) {
        this.openInteractionModal(index);
    }

    swapInteraction(index) {
        const interaction = this.interactions[index];
        if (interaction) {
            // Swap from and to
            const temp = interaction.from;
            interaction.from = interaction.to;
            interaction.to = temp;

            this.saveToStorage();
            this.renderDiagram();
            this.showNotification('Interaction direction reversed!', 'success');
        }
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
    // Value Stream Management
    // ===================================
    openValueStreamFormModal(valueStreamId = null) {
        this.editingValueStreamId = valueStreamId;
        const modal = document.getElementById('valueStreamFormModal');
        const form = document.getElementById('valueStreamForm');
        const title = document.getElementById('valueStreamFormTitle');

        if (valueStreamId) {
            const vs = this.valueStreams.find(v => v.id === valueStreamId);
            if (vs) {
                title.textContent = 'Edit Value Stream';
                document.getElementById('valueStreamName').value = vs.name;
                document.getElementById('valueStreamDescription').value = vs.description || '';
                document.getElementById('valueStreamColor').value = vs.color;
            }
        } else {
            title.textContent = 'Add Value Stream';
            form.reset();
        }

        modal.classList.add('active');
    }

    closeValueStreamFormModal() {
        document.getElementById('valueStreamFormModal').classList.remove('active');
        document.getElementById('valueStreamForm').reset();
        this.editingValueStreamId = null;
    }

    saveValueStream() {
        const name = document.getElementById('valueStreamName').value.trim();
        const description = document.getElementById('valueStreamDescription').value.trim();
        const color = document.getElementById('valueStreamColor').value;

        if (!name) {
            alert('Please enter a value stream name');
            return;
        }

        if (this.editingValueStreamId) {
            // Edit existing
            const vs = this.valueStreams.find(v => v.id === this.editingValueStreamId);
            if (vs) {
                vs.name = name;
                vs.description = description;
                vs.color = color;
            }
        } else {
            // Create new
            this.valueStreams.push({
                id: this.generateId(),
                name,
                description,
                color
            });
        }

        this.saveToStorage();
        this.renderValueStreams();
        this.closeValueStreamFormModal();
        this.showNotification('Value stream saved successfully!', 'success');
    }

    deleteValueStream(id) {
        const vs = this.valueStreams.find(v => v.id === id);
        if (!vs) return;

        if (!confirm(`Delete "${vs.name}"? This will remove it from all teams.`)) {
            return;
        }

        // Remove from value streams array
        this.valueStreams = this.valueStreams.filter(v => v.id !== id);

        // Remove from all teams
        this.teams.forEach(team => {
            if (team.valueStreams) {
                team.valueStreams = team.valueStreams.filter(vsId => vsId !== id);
            }
        });

        this.saveToStorage();
        this.renderValueStreams();
        this.render();
        this.showNotification('Value stream deleted', 'success');
    }

    renderValueStreams() {
        const list = document.getElementById('valueStreamList');
        const emptyState = document.getElementById('valueStreamEmptyState');

        if (this.valueStreams.length === 0) {
            list.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        list.style.display = 'flex';
        emptyState.style.display = 'none';

        list.innerHTML = this.valueStreams.map(vs => `
            <div class="value-stream-item">
                <div class="value-stream-color" style="background: ${vs.color};"></div>
                <div class="value-stream-info">
                    <div class="value-stream-name">${this.escapeHtml(vs.name)}</div>
                    ${vs.description ? `<div class="value-stream-description">${this.escapeHtml(vs.description)}</div>` : ''}
                </div>
                <div class="value-stream-actions">
                    <button class="btn btn-secondary vs-edit-btn" data-vs-id="${vs.id}">
                        Edit
                    </button>
                    <button class="btn btn-danger vs-delete-btn" data-vs-id="${vs.id}">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to the dynamically created buttons
        list.querySelectorAll('.vs-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openValueStreamFormModal(btn.dataset.vsId);
            });
        });

        list.querySelectorAll('.vs-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteValueStream(btn.dataset.vsId);
            });
        });
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
            interactions: this.interactions,
            valueStreams: this.valueStreams
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
                    this.valueStreams = [];
                } else {
                    this.teams = data.teams || [];
                    this.interactions = data.interactions || [];
                    this.valueStreams = data.valueStreams || [];
                }
            } catch (e) {
                console.error('Failed to load data from storage', e);
                this.teams = [];
                this.interactions = [];
                this.valueStreams = [];
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
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TeamPlanner();
});
