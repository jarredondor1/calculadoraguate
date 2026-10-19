(() => {
  const quote = Object.freeze({months: 8, equipment: 5, students: 60, net: 63494, tax: 7619.28, totalWithVat: 71113.28, initial: 14222.66, installment: 7111.33, suggestedFee: 200});
  const currency = new Intl.NumberFormat('es-GT', {style: 'currency', currency: 'GTQ', minimumFractionDigits: 2, maximumFractionDigits: 2});
  const feeInput = document.getElementById('school-fee');
  const studentsInput = document.getElementById('student-count');
  const results = document.getElementById('results');
  const message = document.getElementById('validation-message');

  function calculate(monthlyFee, students) {
    const revenue = monthlyFee * students * quote.months;
    const grossDifference = revenue - quote.totalWithVat;
    return {
      revenue,
      grossDifference,
      differencePerStudent: grossDifference / students,
      differencePerStudentMonth: grossDifference / (students * quote.months),
      monthlyRevenue: monthlyFee * students
    };
  }

  function render() {
    const monthlyFee = Number(feeInput.value);
    const students = Number(studentsInput.value);
    const feeValid = feeInput.value.trim() !== '' && Number.isFinite(monthlyFee) && monthlyFee >= 1 && monthlyFee <= 10000;
    const studentsValid = studentsInput.value.trim() !== '' && Number.isSafeInteger(students) && students >= 1 && students <= 500;
    const valid = feeValid && studentsValid;

    feeInput.setAttribute('aria-invalid', String(!feeValid));
    studentsInput.setAttribute('aria-invalid', String(!studentsValid));
    results.hidden = !valid;
    message.hidden = valid;
    if (!valid) return;

    const estimate = calculate(monthlyFee, students);
    document.getElementById('revenue-estimate').textContent = currency.format(estimate.revenue);
    document.getElementById('revenue-breakdown').textContent = `${currency.format(estimate.monthlyRevenue)} al mes · ${students} estudiantes`;
    document.getElementById('gross-difference').textContent = currency.format(estimate.grossDifference);
    document.getElementById('difference-per-student').textContent = currency.format(estimate.differencePerStudent);
    document.getElementById('difference-per-student-month').textContent = currency.format(estimate.differencePerStudentMonth);
  }

  feeInput.addEventListener('input', render);
  studentsInput.addEventListener('input', render);
  document.getElementById('scenario-form').addEventListener('submit', event => event.preventDefault());
  render();
})();
