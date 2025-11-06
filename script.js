        let budget = {
            total: 0,
            current: 0,
            monthly: 0,
            departure: null
        };

        let expenses = [];
        let currentTab = 'all';

        function loadData() {
            const saved = localStorage.getItem('travelBudget');
            if (saved) {
                const data = JSON.parse(saved);
                budget = data.budget;
                expenses = data.expenses;
                
                document.getElementById('budgetInput').value = budget.total;
                document.getElementById('currentMoneyInput').value = budget.current;
                document.getElementById('monthlyEarnings').value = budget.monthly;
                document.getElementById('departureDate').value = budget.departure || '';
            }
            updateDisplay();
        }

        function saveData() {
            localStorage.setItem('travelBudget', JSON.stringify({
                budget: budget,
                expenses: expenses
            }));
        }

        function updateBudget() {
            budget.total = parseFloat(document.getElementById('budgetInput').value) || 0;
            budget.current = parseFloat(document.getElementById('currentMoneyInput').value) || 0;
            budget.monthly = parseFloat(document.getElementById('monthlyEarnings').value) || 0;
            budget.departure = document.getElementById('departureDate').value;
            
            saveData();
            updateDisplay();
        }

        function updateExtraAmount() {
            const total = parseFloat(document.getElementById('totalBudget').textContent.replace('$', '')) || 0;
            const expected = parseFloat(document.getElementById('currentMoney').textContent.replace('$', '')) || 0;

            const extra = expected - total;

            document.getElementById('extraMoney').textContent = `$${extra.toFixed(2)}`;
        }

        function addExpense() {
            let category = document.getElementById('expenseCategory').value;
            const customCategory = document.getElementById('customCategory').value.trim();
            const amount = parseFloat(document.getElementById('expenseAmount').value);
            const date = document.getElementById('expenseDate').value;
            const type = document.getElementById('expenseType').value;

            if (!amount || !date) {
                alert('Please fill in all fields');
                return;
            }

            if (category === 'custom' && customCategory) {
                category = customCategory;
            } else if (category === 'custom' && !customCategory) {
                alert('Please type your custom category.');
                return;
            }

            expenses.push({
                id: Date.now(),
                category: category,
                amount: amount,
                date: date,
                type: type
            });

            document.getElementById('expenseAmount').value = '';
            document.getElementById('customCategory').value = '';
            document.getElementById('customCategory').style.display = 'none';
            document.getElementById('expenseCategory').value = '';

            saveData();
            updateDisplay();
        }


        function deleteExpense(id) {
            expenses = expenses.filter(e => e.id !== id);
            saveData();
            updateDisplay();
        }

        function editExpense(id) {
            const expense = expenses.find(e => e.id === id);
            if (!expense) return;
            
            document.getElementById('expenseCategory').value = expense.category;
            document.getElementById('expenseAmount').value = expense.amount;
            document.getElementById('expenseDate').value = expense.date;
            document.getElementById('expenseType').value = expense.type;
            
            deleteExpense(id);
            
            document.querySelector('.input-section:nth-of-type(2)').scrollIntoView({ behavior: 'smooth' });
            
        }

        function calculateFinances() {
            const paidExpenses = expenses.filter(e => e.type === 'paid')
                .reduce((sum, e) => sum + e.amount, 0);
            
            const upcomingExpenses = expenses.filter(e => e.type === 'upcoming')
                .reduce((sum, e) => sum + e.amount, 0);

            let projectedMoney = budget.current;
            
            if (budget.departure && budget.monthly) {
                const today = new Date();
                const departure = new Date(budget.departure);
                const monthsUntil = Math.max(0, (departure - today) / (1000 * 60 * 60 * 24 * 30));
                projectedMoney += budget.monthly * monthsUntil;
            }

            const remaining = budget.total - paidExpenses - upcomingExpenses;
            const daysUntil = budget.departure ? 
                Math.ceil((new Date(budget.departure) - new Date()) / (1000 * 60 * 60 * 24)) : null;

            return {
                paid: paidExpenses,
                upcoming: upcomingExpenses,
                projected: projectedMoney,
                remaining: remaining,
                daysUntil: daysUntil
            };
        }

        

        function updateDisplay() {
            const finances = calculateFinances();

            document.getElementById('totalBudget').textContent = `$${budget.total.toFixed(2)}`;
            document.getElementById('currentMoney').textContent = `$${finances.projected.toFixed(2)}`;
            document.getElementById('totalSpent').textContent = `$${finances.paid.toFixed(2)}`;
            document.getElementById('upcomingTotal').textContent = `$${finances.upcoming.toFixed(2)}`;
            document.getElementById('remainingBudget').textContent = `$${finances.remaining.toFixed(2)}`;
            
            if (finances.daysUntil !== null) {
                document.getElementById('daysUntil').textContent = finances.daysUntil > 0 ? 
                    finances.daysUntil : 'Today!';
            }

            const progress = budget.total > 0 ? 
                ((finances.paid + finances.upcoming) / budget.total) * 100 : 0;
            document.getElementById('progressFill').style.width = `${Math.min(progress, 100)}%`;

            updateExtraAmount();
            renderExpenses();
        }

        function renderExpenses() {
            const list = document.getElementById('expenseList');
            let filtered = expenses;

            if (currentTab === 'paid') {
                filtered = expenses.filter(e => e.type === 'paid');
            } else if (currentTab === 'upcoming') {
                filtered = expenses.filter(e => e.type === 'upcoming');
            }

            if (filtered.length === 0) {
                list.innerHTML = '<div class="empty-state">No expenses in this category yet.</div>';
                return;
            }

            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

            list.innerHTML = filtered.map(expense => `
                <div class="expense-item ${expense.type === 'upcoming' ? 'upcoming' : ''}">
                    <div class="expense-info">
                        <div class="expense-category">${expense.category}</div>
                        <div class="expense-date">${new Date(expense.date).toLocaleDateString()}</div>
                    </div>
                    <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                    <button class="update-btn" onclick="editExpense(${expense.id})">Update</button>
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
                </div>
            `).join('');
        }

        function toggleCustomCategory(select) {
            const customInput = document.getElementById('customCategory');
            if (select.value === 'custom') {
                customInput.style.display = 'block';
                customInput.focus();
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
            }
        }



        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            renderExpenses();
        }

        function exportData() {
            const data = {
                budget: budget,
                expenses: expenses,
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `travel-budget-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert('✅ Budget data downloaded! Send this file to share your budget.');
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!data.budget || !data.expenses) {
                        alert('❌ Invalid file format. Please select a valid budget file.');
                        return;
                    }

                    budget = data.budget;
                    expenses = data.expenses;
                    
                    document.getElementById('budgetInput').value = budget.total;
                    document.getElementById('currentMoneyInput').value = budget.current;
                    document.getElementById('monthlyEarnings').value = budget.monthly;
                    document.getElementById('departureDate').value = budget.departure || '';
                    
                    saveData();
                    updateDisplay();
                    
                    alert('✅ Budget data imported successfully!');
                } catch (error) {
                    alert('❌ Error reading file. Please make sure it\'s a valid budget file.');
                    console.error('Import error:', error);
                }
            };
            
            reader.readAsText(file);
            event.target.value = '';
        }

        loadData();
