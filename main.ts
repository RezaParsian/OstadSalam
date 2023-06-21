import axios from 'axios';
import * as cheerio from 'cheerio'

type Teacher = {
    name: string,
    url: string,
    token?: string,
    mobile?: string
    phone?: string
};

async function getTeacherList(page: number = 1): Promise<Teacher[]> {
    return await axios.post('https://ostadsalam.ir/clientlesson/lessonlistpaging/', {
        page: page,
    }).then(response => {
        let teachers: Teacher[] = [];
        let data: string = response.data;
        let $ = cheerio.load(data);

        let $teacher = $('.teacher-r');

        $teacher.each((index, element) => {
            let name: string = $(element).attr('title') as string;
            let url: string = 'https://ostadsalam.ir' + $(element).attr('href');

            teachers.push({
                name,
                url
            })
        })

        return teachers;
    })
}

async function extractTeacherToken(teachers: Teacher[]) {
    for (let teacher of teachers) {
        let result = await axios.get(teacher.url);

        let regex = /this,'(?<token>.*?)'/gm;
        let data: string = result.data;
        let $ = cheerio.load(data);
        let btnPhoneNumber: string = $('.btn-show-phone.href-show-phone2.loading-btn').eq(0).attr('onclick') as string;

        teacher.token = regex.exec(btnPhoneNumber)?.[1];
    }

    return teachers;
}

async function getPhoneNumberWithToken(token: string) {
    return await axios.post('https://ostadsalam.ir/api/BaseApi/GetContactNumber', {
        token
    }, {
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    }).then(response => {
        return response.data.result;
    })
}

(async function () {
    let newTeachers:Teacher[]=[];
    let teachers: Teacher[] = await getTeacherList(1);
    teachers = await extractTeacherToken(teachers);

    for (let teacher of teachers) {
        newTeachers.push({
            ...teacher,
            ...await getPhoneNumberWithToken(teacher.token as string)
        } as Teacher);
    }

    console.log(newTeachers);
})();