const text = `Авто від страхової!

Вартість авто на аукціоні США - {{price}} $
Стан Run & Drive
Пробіг -  {{miles}} mi (ACTUAL)
Привід -  {{drive}}
Двигун -  {{engine}} AКПП

Окрім цього автомобіля маємо багато інших варіантів авто.
Детальніше звертайтесь по телефону або в приватні повідомлення

Доставка до двох місяців в Україну Через Литву та Німеччину

Компанія Global Auto Logistic
На ринку близько 4-ох років!!!
Більше 4000 задоволених клієнтів

Майданчик з продажу автомобілів в наявності у Львові та Тернополі
Головний офіс у Львові, філіали у Луцьку, Києві та Івано - Франківську

Авто під ключ Із аукціонів COPART та IAAI
Наші послуги - 400$
Без прихованих платежів`;


// Usage example
  var selectors = [
   'div[aria-label="На ходу, технічно справна"]',                      
   'div[aria-label="Звичайний продаж"]',
   'div[aria-label="Гаражне зберігання"]',
   'div[aria-label="Не бита"]',
   'div[aria-label="Не фарбована"]',
   'div[aria-label="Перший власник"]',
   'div[aria-label="Сервісна книжка"]',
   'div[aria-label="Електропакет"]',
   'div[aria-label="Підігрів дзеркал"]',
   'div[aria-label="Електросклопiдйомники"]',
   'div[aria-label="Обігрів керма"]',
   'div[aria-label="Підсилювач керма"]',
   'div[aria-label="Тонування скла"]',
   'div[aria-label="Бортовий комп\'ютер"]',
   'div[aria-label="Датчик світла"]',
   'div[aria-label="Пам\'ять сидінь"]',
   'div[aria-label="Запуск кнопкою"]',
   'div[aria-label="Датчик дощу"]',
   'div[aria-label="Клімат контроль"]',
   'div[aria-label="Шкіряний салон"]',
   'div[aria-label="Панорамний дах"]',
   'div[aria-label="Круїз контроль"]',
   'div[aria-label="Ел. регулювання сидінь"]',
   'div[aria-label="Люк"]',
   'div[aria-label="Камера заднього виду"]',
   'div[aria-label="Мультируль"]',
   'div[aria-label="Омивач фар"]',
   'div[aria-label="CD"]',
   'div[aria-label="AUX"]',
   'div[aria-label="Bluetooth"]',
   'div[aria-label="USB"]',
   'div[aria-label="Акустика"]',
   'div[aria-label="Магнітола"]',
   'div[aria-label="Підсилювач"]',
   'div[aria-label="Сабвуфер"]',
   'div[aria-label="Система навігації GPS"]',
   'div[aria-label="ABD"]',
   'div[aria-label="ABS"]',
   'div[aria-label="EPS"]',
   'div[aria-label="Сервокермо"]',
   'div[aria-label="Сигналізація"]',
   'div[aria-label="Центральний замок"]',
   'div[aria-label="Ксенон"]',
   'div[aria-label="Іммобілайзер"]',
   'div[aria-label="Денні ходові вогні"]',
   'div[aria-label="GPS трекер"]',
   'div[aria-label="Безключовий доступ"]',
   'div[aria-label="Подушка безпеки (Airbag)"]',
   'div[aria-label="Парктроник"]',
   'div[aria-label="Підігрів сидінь"]',
   'div[aria-label="Клiмат контроль"]',
   'div[aria-label="ESP"]',
   'div[aria-label="Індивідуальна комплектація"]',
   'div[aria-label="Галогенні фари"]',
   'div[data-testid="private_business_business_unactive"] > button',
  ];

const lines = text.split('\n');

let descriptionElement = document.getElementById('description');
if (descriptionElement) {
descriptionElement.value = lines.join('\n');
} else {
console.error("Елемент опису не знайдено за допомогою XPath.");
}

function openDropdown(selector) {
  const element = document.querySelector(selector);
	element.dispatchEvent(new FocusEvent('focusin', {bubbles: true, cancelable: false, composed: true, detail: 0, relatedTarget: null, view: window}));
  return element;
}

function selectDropdown(selector, itemIndex) {
  return new Promise(resolve => {
    const element = openDropdown(selector);
	
    setTimeout(function() {
      const dropdownOption = element.parentElement.parentElement.querySelector('ul > li:nth-child('+(itemIndex+1) +') a');
      dropdownOption.click();
      resolve();
    }, 100);
  });
	
}

window.selectDropdown = selectDropdown;
window.openDropdown = openDropdown;

async function clickOnElements(selectors) {
	for(let selector of selectors) {
		await new Promise(resolve => {
			const element = document.querySelector(selector);
			if(!element) {
				console.warn('not found: ', selector);
				resolve();
				return;
			}
			setTimeout(() => {
				element.click();
				resolve();
			}, 1);
		});
	}
}
  
  (async () => {
	  const uniqueSelectors = selectors.filter((value, index, array) => array.indexOf(value) === index);
    await clickOnElements(uniqueSelectors);
	  selectDropdown('div[data-cy="price-field"] div[data-testid="dropdown"] button[data-testid="dropdown-head-button"]', 1);
	  selectDropdown('div[data-cy="parameters.car_state_type"] button[data-testid="dropdown-head-button"]', 2);
	  selectDropdown('div[data-cy="parameters.cleared_customs"] button[data-testid="dropdown-head-button"]', 2);
	  selectDropdown('div[data-cy="parameters.car_from"] input[data-testid="dropdown-head-input"]', 0);
	  selectDropdown('div[data-cy="parameters.transmission_type"] button[data-testid="dropdown-head-button"]', 1);
	  selectDropdown('div[data-cy="parameters.exterior_condition"] button[data-testid="dropdown-head-button"]', 2);
  })();